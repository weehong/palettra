import type { BrowserContext, Route } from "@playwright/test";

import { FIREBASE_TEST_ENV } from "./firebase-env";
import { TEST_USER } from "./auth";

/**
 * In-memory fake of the Firestore backend, speaking just enough of the
 * WebChannel wire protocol (v8) for the SDK's Listen/Write streams:
 *
 * - Handshake POST (no SID): the open frame `[[0,["c",<sid>,"",8]]]` is the
 *   first body frame (the client's last-seen array id starts at -1; the
 *   header handshake is only used in fastHandshake mode, which Firestore
 *   doesn't enable). Immediately-available message frames follow it.
 * - Message frames are `LEN\n[[aid,[<response JSON>]]]` — Firestore reads
 *   `msg.data[0]`.
 * - Subsequent forward-channel POSTs are acked with `LEN\n[1,<lastAid>,0]`;
 *   their response payloads flow through the parked backchannel GET.
 * - Backchannel GETs (`TYPE=xmlhttp`) are parked until a frame is queued.
 *
 * All responses carry CORS headers (the app origin differs from
 * firestore.googleapis.com) — `Access-Control-Expose-Headers` on the
 * handshake is load-bearing.
 *
 * Set FIRESTORE_FAKE_DEBUG=1 to log the decoded traffic.
 */

type FirestoreValue = Record<string, unknown>;

type StoredDoc = {
	id: string;
	fields: Record<string, FirestoreValue>;
	createTime: string;
	updateTime: string;
};

const PROJECT_ID = FIREBASE_TEST_ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const DB_PREFIX = `projects/${PROJECT_ID}/databases/(default)/documents`;
const DEBUG = process.env.FIRESTORE_FAKE_DEBUG === "1";

function debugLog(...args: Array<unknown>): void {
	if (DEBUG) {
		console.log("[firestore-fake]", ...args);
	}
}

/** Plain JS → Firestore Value JSON. */
export function jsToValue(value: unknown): FirestoreValue {
	if (value === null || value === undefined) {
		return { nullValue: null };
	}
	if (typeof value === "string") {
		return { stringValue: value };
	}
	if (typeof value === "boolean") {
		return { booleanValue: value };
	}
	if (typeof value === "number") {
		return Number.isInteger(value)
			? { integerValue: `${value}` }
			: { doubleValue: value };
	}
	if (Array.isArray(value)) {
		return { arrayValue: { values: value.map(jsToValue) } };
	}
	if (typeof value === "object") {
		const fields: Record<string, FirestoreValue> = {};
		for (const [key, child] of Object.entries(value)) {
			fields[key] = jsToValue(child);
		}
		return { mapValue: { fields } };
	}
	throw new Error(`Unsupported value: ${typeof value}`);
}

/** Firestore Value JSON → plain JS. */
export function valueToJs(value: FirestoreValue): unknown {
	if ("nullValue" in value) {
		return null;
	}
	if ("stringValue" in value) {
		return value.stringValue;
	}
	if ("booleanValue" in value) {
		return value.booleanValue;
	}
	if ("integerValue" in value) {
		return Number(value.integerValue);
	}
	if ("doubleValue" in value) {
		return value.doubleValue;
	}
	if ("timestampValue" in value) {
		return value.timestampValue;
	}
	if ("arrayValue" in value) {
		const values =
			(value.arrayValue as { values?: Array<FirestoreValue> }).values ?? [];
		return values.map(valueToJs);
	}
	if ("mapValue" in value) {
		const fields =
			(value.mapValue as { fields?: Record<string, FirestoreValue> }).fields ??
			{};
		return Object.fromEntries(
			Object.entries(fields).map(([k, v]) => [k, valueToJs(v)]),
		);
	}
	return undefined;
}

function frame(frames: Array<[number, unknown]>): string {
	const json = JSON.stringify(frames);
	return `${json.length}\n${json}`;
}

/**
 * The channel requests are credentialed (`supportsCrossDomainXhr`), so the
 * allowed origin must echo the caller — `*` is rejected by the browser.
 */
function corsHeaders(route: Route): Record<string, string> {
	const origin = route.request().headers()["origin"] ?? "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
		"Access-Control-Allow-Headers": "*",
		"Access-Control-Expose-Headers":
			"X-HTTP-Initial-Response,X-HTTP-Session-Id,Content-Type",
	};
}

type Session = {
	kind: "Listen" | "Write";
	queue: Array<[number, unknown]>;
	nextAid: number;
	parked: Route | null;
	streamTokenCounter: number;
};

export class FirestoreFake {
	private docs = new Map<string, StoredDoc>();
	private sessions = new Map<string, Session>();
	private sidCounter = 0;
	private writeCounter = 0;
	/** Every decoded client message, for traffic assertions. */
	readonly messageLog: Array<{ kind: string; message: unknown }> = [];

	async install(context: BrowserContext): Promise<void> {
		await context.route("https://firestore.googleapis.com/**", (route) =>
			this.handle(route),
		);
		// The WebChannel client probes connectivity with cleardot.gif after
		// transport errors; answer it locally so tests stay hermetic.
		await context.route("https://www.google.com/images/cleardot.gif*", (route) =>
			route.fulfill({
				contentType: "image/gif",
				body: Buffer.from("R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", "base64"),
			}),
		);
	}

	/** Decoded palette docs, newest first — for direct spec assertions. */
	get palettes(): Array<Record<string, unknown> & { id: string }> {
		return [...this.docs.values()]
			.map((docEntry): Record<string, unknown> & { id: string } => ({
				id: docEntry.id,
				...(Object.fromEntries(
					Object.entries(docEntry.fields).map(([k, v]) => [k, valueToJs(v)]),
				) as Record<string, unknown>),
			}))
			.sort((a, b) =>
				String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")),
			);
	}

	seedPalette(input: {
		id: string;
		name: string;
		roles: Array<Record<string, unknown>>;
		typography?: Record<string, unknown> | null;
		href: string;
		updatedAt?: string;
	}): void {
		const updatedAt = input.updatedAt ?? new Date().toISOString();
		this.docs.set(input.id, {
			id: input.id,
			createTime: updatedAt,
			updateTime: updatedAt,
			fields: {
				name: jsToValue(input.name),
				roles: jsToValue(input.roles),
				typography: jsToValue(input.typography ?? null),
				href: jsToValue(input.href),
				createdAt: { timestampValue: updatedAt },
				updatedAt: { timestampValue: updatedAt },
			},
		});
	}

	private handle(route: Route): void {
		const request = route.request();
		const url = new URL(request.url());
		const method = request.method();

		if (method === "OPTIONS") {
			return void route.fulfill({ status: 204, headers: corsHeaders(route) });
		}

		const kind = url.pathname.includes("/Listen/") ? "Listen" : "Write";
		const sid = url.searchParams.get("SID");
		const type = url.searchParams.get("TYPE");

		debugLog(
			`${method} ${kind}`,
			Object.fromEntries(url.searchParams.entries()),
			request.postData()?.slice(0, 500) ?? "",
		);

		if (type === "terminate") {
			if (sid) {
				this.sessions.delete(sid);
			}
			return void route.fulfill({
				status: 200,
				headers: { ...corsHeaders(route), "Content-Type": "text/plain" },
				body: "",
			});
		}

		if (method === "POST" && !sid) {
			return this.handleHandshake(route, kind);
		}
		const session = sid ? this.sessions.get(sid) : undefined;
		if (!session) {
			debugLog("unknown session", sid);
			return void route.fulfill({
				status: 400,
				headers: corsHeaders(route),
				body: "Unknown SID",
			});
		}
		if (method === "POST") {
			return this.handleForward(route, session);
		}
		return this.handleBackchannel(route, session);
	}

	private handleHandshake(route: Route, kind: Session["kind"]): void {
		this.sidCounter += 1;
		const sid = `e2e-sid-${this.sidCounter}`;
		const session: Session = {
			kind,
			queue: [],
			nextAid: 1,
			parked: null,
			streamTokenCounter: 0,
		};
		this.sessions.set(sid, session);

		for (const message of this.parseMessages(route)) {
			this.process(session, message);
		}

		// The open frame rides in the body as aid 0 (the client starts its
		// last-seen array id at -1 and only uses the header handshake in
		// fastHandshake mode, which Firestore doesn't enable).
		const body = frame([
			[0, ["c", sid, "", 8]],
			...session.queue,
		]);
		session.queue = [];
		debugLog(`handshake ${kind} → sid=${sid}`, JSON.stringify(body));
		void route.fulfill({
			status: 200,
			headers: {
				...corsHeaders(route),
				"Content-Type": "text/plain; charset=utf-8",
				"X-HTTP-Session-Id": sid,
			},
			body,
		});
	}

	private handleForward(route: Route, session: Session): void {
		for (const message of this.parseMessages(route)) {
			this.process(session, message);
		}
		const ack = JSON.stringify([1, session.nextAid - 1, 0]);
		void route.fulfill({
			status: 200,
			headers: { ...corsHeaders(route), "Content-Type": "text/plain; charset=utf-8" },
			body: `${ack.length}\n${ack}`,
		});
		this.flush(session);
	}

	private handleBackchannel(route: Route, session: Session): void {
		session.parked = route;
		this.flush(session);
	}

	private flush(session: Session): void {
		if (!session.parked || session.queue.length === 0) {
			return;
		}
		const body = frame(session.queue);
		debugLog("backchannel flush", body);
		const parked = session.parked;
		session.parked = null;
		session.queue = [];
		void parked
			.fulfill({
				status: 200,
				headers: {
					...corsHeaders(parked),
					"Content-Type": "text/plain; charset=utf-8",
				},
				body,
			})
			.catch(() => {
				// The client may have timed out and re-issued the GET.
			});
	}

	private parseMessages(route: Route): Array<Record<string, unknown>> {
		const body = route.request().postData() ?? "";
		const params = new URLSearchParams(body);
		const messages: Array<Record<string, unknown>> = [];
		for (const [key, value] of params.entries()) {
			if (/^req\d+___data__$/.test(key)) {
				try {
					messages.push(JSON.parse(value) as Record<string, unknown>);
				} catch {
					debugLog("unparseable message", value);
				}
			}
		}
		return messages;
	}

	private enqueue(session: Session, response: unknown): void {
		session.queue.push([session.nextAid, [response]]);
		session.nextAid += 1;
	}

	private process(
		session: Session,
		message: Record<string, unknown>,
	): void {
		this.messageLog.push({ kind: session.kind, message });
		debugLog("message", session.kind, JSON.stringify(message).slice(0, 400));

		if (session.kind === "Write") {
			return this.processWrite(session, message);
		}
		return this.processListen(session, message);
	}

	private processWrite(
		session: Session,
		message: Record<string, unknown>,
	): void {
		const writes = message.writes as Array<Record<string, unknown>> | undefined;
		if (!writes) {
			// Stream handshake: `{database}` — answer with the first stream token.
			session.streamTokenCounter += 1;
			this.enqueue(session, {
				streamToken: btoa(`e2e-stream-${session.streamTokenCounter}`),
			});
			return;
		}

		const now = new Date().toISOString();
		const writeResults = writes.map((write) => this.applyWrite(write, now));
		session.streamTokenCounter += 1;
		this.enqueue(session, {
			streamToken: btoa(`e2e-stream-${session.streamTokenCounter}`),
			writeResults,
			commitTime: now,
		});
	}

	private applyWrite(
		write: Record<string, unknown>,
		now: string,
	): Record<string, unknown> {
		this.writeCounter += 1;

		if (typeof write.delete === "string") {
			const id = write.delete.split("/").pop() ?? "";
			this.docs.delete(id);
			return { updateTime: now };
		}

		const update = write.update as
			| { name: string; fields?: Record<string, FirestoreValue> }
			| undefined;
		if (!update) {
			return { updateTime: now };
		}
		const id = update.name.split("/").pop() ?? "";
		const existing = this.docs.get(id);
		const mask = write.updateMask as { fieldPaths?: Array<string> } | undefined;

		let fields: Record<string, FirestoreValue>;
		if (existing && mask) {
			fields = { ...existing.fields };
			for (const path of mask.fieldPaths ?? []) {
				const incoming = update.fields?.[path];
				if (incoming === undefined) {
					delete fields[path];
				} else {
					fields[path] = incoming;
				}
			}
		} else {
			fields = { ...(update.fields ?? {}) };
		}

		const transforms = write.updateTransforms as
			| Array<{ fieldPath: string; setToServerValue?: string }>
			| undefined;
		const transformResults: Array<FirestoreValue> = [];
		for (const transform of transforms ?? []) {
			if (transform.setToServerValue) {
				fields[transform.fieldPath] = { timestampValue: now };
				transformResults.push({ timestampValue: now });
			}
		}

		this.docs.set(id, {
			id,
			fields,
			createTime: existing?.createTime ?? now,
			updateTime: now,
		});

		const result: Record<string, unknown> = { updateTime: now };
		if (transformResults.length > 0) {
			result.transformResults = transformResults;
		}
		return result;
	}

	private processListen(
		session: Session,
		message: Record<string, unknown>,
	): void {
		const addTarget = message.addTarget as
			| {
					targetId?: number;
					query?: { parent?: string };
			  }
			| undefined;
		if (!addTarget) {
			// removeTarget or bare `{database}` handshake — nothing to send.
			return;
		}

		const targetId = addTarget.targetId ?? 2;
		const now = new Date().toISOString();
		const resumeToken = btoa("e2e-resume");

		this.enqueue(session, {
			targetChange: { targetChangeType: "ADD", targetIds: [targetId] },
		});

		const sorted = [...this.docs.values()].sort((a, b) =>
			(b.fields.updatedAt?.timestampValue as string ?? "").localeCompare(
				(a.fields.updatedAt?.timestampValue as string) ?? "",
			),
		);
		for (const docEntry of sorted) {
			this.enqueue(session, {
				documentChange: {
					document: {
						name: `${DB_PREFIX}/users/${TEST_USER.uid}/palettes/${docEntry.id}`,
						fields: docEntry.fields,
						createTime: docEntry.createTime,
						updateTime: docEntry.updateTime,
					},
					targetIds: [targetId],
				},
			});
		}

		this.enqueue(session, {
			targetChange: {
				targetChangeType: "CURRENT",
				targetIds: [targetId],
				resumeToken,
				readTime: now,
			},
		});
		this.enqueue(session, {
			targetChange: {
				targetChangeType: "NO_CHANGE",
				targetIds: [],
				resumeToken,
				readTime: now,
			},
		});
	}
}
