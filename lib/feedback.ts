/**
 * The feedback channel's domain rules.
 *
 * Everything here is pure: no environment reads at module scope, no transport,
 * no clock. `readSmtpConfig` takes the environment as an argument so this file
 * stays safe to import from the client bundle (the dialog needs the types and
 * the length bounds) while the route handler owns all the IO.
 */

/** Which of the three kinds a submission is. See CONTEXT.md. */
export type FeedbackType = "general" | "feature" | "bug";

export type FeedbackTypeOption = {
	value: FeedbackType;
	/** What the submitter sees in the dialog. */
	label: string;
	/** What the operator sees in the mailbox subject line. */
	subject: string;
};

export const FEEDBACK_TYPES: ReadonlyArray<FeedbackTypeOption> = [
	{ value: "general", label: "Feedback", subject: "Feedback" },
	{ value: "feature", label: "Feature request", subject: "Feature request" },
	{ value: "bug", label: "Bug report", subject: "Bug report" },
];

export const MESSAGE_MIN_LENGTH = 10;
export const MESSAGE_MAX_LENGTH = 2000;
/** RFC 5321 caps a full address at 254 characters. */
export const EMAIL_MAX_LENGTH = 254;
/**
 * Reading the dialog, picking a type, and typing a sentence takes a human
 * longer than this. Anything faster is treated as automation.
 */
export const MIN_FILL_DURATION_MS = 3000;
/** Longest subject-line summary lifted from the message body. */
const SUBJECT_SUMMARY_LENGTH = 60;

export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export type FeedbackSubmission = {
	type: FeedbackType;
	message: string;
	/** Empty when the submitter chose not to hear back. */
	email: string;
};

export type FeedbackRequest = FeedbackSubmission & {
	/** Honeypot. Real submitters never see this field, so it stays empty. */
	website: string;
	/** Milliseconds the dialog was open before submit, measured client-side. */
	elapsedMs: number;
};

export type FeedbackValidation =
	{ ok: true; submission: FeedbackSubmission } | { ok: false; error: string };

// Deliberately loose: the only guarantees we need are "has an @", "has a dot in
// the domain", and "contains no whitespace" — the last of which is what keeps a
// newline out of the Reply-To header.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function isFeedbackType(value: unknown): value is FeedbackType {
	return FEEDBACK_TYPES.some((option) => option.value === value);
}

/**
 * Screen out automation before validating.
 *
 * A filled honeypot is a bot every time, so the caller should accept and
 * discard the submission silently rather than teach the bot what tripped it.
 * A suspiciously fast submit is only a hint — a human can paste a prepared
 * message — so that case is reported back to the caller as a real error the
 * submitter can recover from.
 */
export function screenFeedbackRequest(
	body: unknown,
): "accept" | "discard" | "too-fast" {
	const record = (body ?? {}) as Record<string, unknown>;
	if (asString(record.website).trim().length > 0) {
		return "discard";
	}
	const elapsedMs =
		typeof record.elapsedMs === "number" && Number.isFinite(record.elapsedMs)
			? record.elapsedMs
			: 0;
	return elapsedMs < MIN_FILL_DURATION_MS ? "too-fast" : "accept";
}

export function validateFeedbackRequest(body: unknown): FeedbackValidation {
	if (typeof body !== "object" || body === null) {
		return { ok: false, error: "Invalid request body" };
	}
	const record = body as Record<string, unknown>;

	if (!isFeedbackType(record.type)) {
		return { ok: false, error: "Choose what kind of message this is" };
	}

	const message = asString(record.message).trim();
	if (message.length < MESSAGE_MIN_LENGTH) {
		return {
			ok: false,
			error: `Tell us a little more — at least ${MESSAGE_MIN_LENGTH} characters`,
		};
	}
	if (message.length > MESSAGE_MAX_LENGTH) {
		return {
			ok: false,
			error: `Keep it under ${MESSAGE_MAX_LENGTH} characters`,
		};
	}

	const email = asString(record.email).trim();
	if (email.length > 0) {
		if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
			return { ok: false, error: "That email address does not look right" };
		}
	}

	return { ok: true, submission: { type: record.type, message, email } };
}

export type FeedbackEmailConfig = {
	/** The operator's mailbox — the only address this channel can ever reach. */
	toAddress: string;
	/** The authenticated transport account. */
	fromAddress: string;
	fromName: string;
};

export type FeedbackEmail = {
	from: string;
	to: string;
	replyTo?: string;
	subject: string;
	text: string;
};

function subjectSummary(message: string): string {
	// Collapsing whitespace also flattens newlines, which is what keeps the
	// message body out of the header block.
	const flattened = message.replace(/\s+/g, " ").trim();
	return flattened.length > SUBJECT_SUMMARY_LENGTH
		? `${flattened.slice(0, SUBJECT_SUMMARY_LENGTH - 1).trimEnd()}…`
		: flattened;
}

/**
 * Build the message the operator receives.
 *
 * `From` is always the authenticated transport account: SPF, DKIM, and DMARC
 * are evaluated against our sending domain, so putting the submitter's address
 * there would get the mail rejected or spam-foldered. The submitter goes in
 * `Reply-To` instead, where hitting reply still reaches the right person.
 */
export function buildFeedbackEmail(
	submission: FeedbackSubmission,
	config: FeedbackEmailConfig,
): FeedbackEmail {
	const option =
		FEEDBACK_TYPES.find((entry) => entry.value === submission.type) ??
		FEEDBACK_TYPES[0];

	const email: FeedbackEmail = {
		from: `"${config.fromName}" <${config.fromAddress}>`,
		to: config.toAddress,
		subject: `[Palettra] ${option.subject} — ${subjectSummary(submission.message)}`,
		text: [
			`Type: ${option.label}`,
			`From: ${submission.email || "not provided"}`,
			"",
			submission.message,
		].join("\n"),
	};

	if (submission.email) {
		email.replyTo = submission.email;
	}
	return email;
}

export type SmtpConfig = {
	host: string;
	port: number;
	/** Implicit TLS on 465; STARTTLS on everything else. */
	secure: boolean;
	user: string;
	password: string;
	toAddress: string;
	fromName: string;
};

const DEFAULT_SMTP_PORT = 587;
const DEFAULT_FROM_NAME = "Palettra Feedback";

/**
 * Resolve the SMTP settings, or null when the channel is not configured.
 *
 * Host, user, and password are all required — a partial configuration is a
 * misconfiguration, and the feedback button should stay hidden for it rather
 * than fail at submit time.
 */
export function readSmtpConfig(
	env: Record<string, string | undefined>,
): SmtpConfig | null {
	const host = (env.SMTP_HOST ?? "").trim();
	const user = (env.SMTP_USER ?? "").trim();
	const password = env.SMTP_PASSWORD ?? "";
	if (!host || !user || !password) {
		return null;
	}

	const parsedPort = Number.parseInt((env.SMTP_PORT ?? "").trim(), 10);
	const port =
		Number.isFinite(parsedPort) && parsedPort > 0
			? parsedPort
			: DEFAULT_SMTP_PORT;

	return {
		host,
		port,
		secure: port === 465,
		user,
		password,
		toAddress: (env.FEEDBACK_TO_EMAIL ?? "").trim() || user,
		fromName: (env.FEEDBACK_FROM_NAME ?? "").trim() || DEFAULT_FROM_NAME,
	};
}

export function isFeedbackConfigured(
	env: Record<string, string | undefined>,
): boolean {
	return readSmtpConfig(env) !== null;
}
