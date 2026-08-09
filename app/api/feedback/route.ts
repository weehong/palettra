import nodemailer from "nodemailer";

import {
	RATE_LIMIT_MAX,
	RATE_LIMIT_WINDOW_MS,
	buildFeedbackEmail,
	readSmtpConfig,
	screenFeedbackRequest,
	validateFeedbackRequest,
} from "@/lib/feedback";
import { createRateLimiter } from "@/lib/rate-limit";

// Module scope, so the window survives across requests on a warm instance.
const rateLimiter = createRateLimiter({
	limit: RATE_LIMIT_MAX,
	windowMs: RATE_LIMIT_WINDOW_MS,
});

function clientKey(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	// The left-most entry is the original client; everything after it is proxy
	// chain. Spoofable, which is fine for what this limiter claims to do.
	return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request): Promise<Response> {
	const smtp = readSmtpConfig(process.env);
	if (!smtp) {
		return Response.json({ error: "Feedback not configured" }, { status: 503 });
	}

	if (!rateLimiter.check(clientKey(request), Date.now())) {
		return Response.json(
			{ error: "Too many messages. Try again in a few minutes." },
			{ status: 429 },
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const screening = screenFeedbackRequest(body);
	if (screening === "discard") {
		// Report success so the bot learns nothing about why it failed.
		return Response.json({ ok: true });
	}
	if (screening === "too-fast") {
		return Response.json(
			{ error: "That was quick — take another moment and send again." },
			{ status: 400 },
		);
	}

	const validation = validateFeedbackRequest(body);
	if (!validation.ok) {
		return Response.json({ error: validation.error }, { status: 400 });
	}

	const email = buildFeedbackEmail(validation.submission, {
		toAddress: smtp.toAddress,
		fromAddress: smtp.user,
		fromName: smtp.fromName,
	});

	try {
		const transport = nodemailer.createTransport({
			host: smtp.host,
			port: smtp.port,
			secure: smtp.secure,
			auth: { user: smtp.user, pass: smtp.password },
		});
		await transport.sendMail(email);
	} catch {
		// The mailbox is the only copy of a submission (docs/adr/0001), so a
		// failed send must surface to the submitter rather than be swallowed.
		return Response.json(
			{ error: "Could not send your message. Please try again." },
			{ status: 502 },
		);
	}

	return Response.json({ ok: true });
}
