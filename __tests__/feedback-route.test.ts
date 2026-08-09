import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.hoisted(() => vi.fn());
const createTransport = vi.hoisted(() => vi.fn(() => ({ sendMail })));

vi.mock("nodemailer", () => ({
	default: { createTransport },
}));

import { POST } from "@/app/api/feedback/route";
import { MIN_FILL_DURATION_MS, RATE_LIMIT_MAX } from "@/lib/feedback";

const validBody = {
	type: "feature",
	message: "Please add a Sass variables export alongside the CSS one.",
	email: "someone@example.com",
	website: "",
	elapsedMs: 12_000,
};

/**
 * The route's rate limiter lives at module scope and this suite imports the
 * module once, so every test uses a distinct client address to stay out of its
 * neighbours' budget.
 */
function request(body: unknown, ip: string): Request {
	return new Request("http://localhost/api/feedback", {
		method: "POST",
		headers: { "x-forwarded-for": ip },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

async function json(response: Response): Promise<Record<string, unknown>> {
	return (await response.json()) as Record<string, unknown>;
}

function configureSmtp(): void {
	vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
	vi.stubEnv("SMTP_USER", "transport@gmail.com");
	vi.stubEnv("SMTP_PASSWORD", "app-password");
	vi.stubEnv("FEEDBACK_TO_EMAIL", "operator@example.com");
}

beforeEach(() => {
	sendMail.mockReset();
	sendMail.mockResolvedValue({ messageId: "1" });
	createTransport.mockClear();
	configureSmtp();
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("feedback route", () => {
	it("returns 503 and never sends when SMTP is not configured", async () => {
		vi.stubEnv("SMTP_PASSWORD", "");

		const response = await POST(request(validBody, "10.0.0.1"));

		expect(response.status).toBe(503);
		expect(await json(response)).toEqual({ error: "Feedback not configured" });
		expect(sendMail).not.toHaveBeenCalled();
	});

	it("sends the submission and reports success", async () => {
		const response = await POST(request(validBody, "10.0.0.2"));

		expect(response.status).toBe(200);
		expect(await json(response)).toEqual({ ok: true });
		expect(createTransport).toHaveBeenCalledWith({
			host: "smtp.gmail.com",
			port: 587,
			secure: false,
			auth: { user: "transport@gmail.com", pass: "app-password" },
		});
		expect(sendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: "operator@example.com",
				from: '"Palettra Feedback" <transport@gmail.com>',
				replyTo: "someone@example.com",
				subject: expect.stringContaining("[Palettra] Feature request"),
			}),
		);
	});

	it("returns 400 for a malformed JSON body", async () => {
		const response = await POST(request("{not json", "10.0.0.3"));

		expect(response.status).toBe(400);
		expect(sendMail).not.toHaveBeenCalled();
	});

	it("returns 400 for a submission that fails validation", async () => {
		const response = await POST(
			request({ ...validBody, message: "short" }, "10.0.0.4"),
		);

		expect(response.status).toBe(400);
		expect(sendMail).not.toHaveBeenCalled();
	});

	it("accepts but discards a honeypot submission without sending", async () => {
		const response = await POST(
			request({ ...validBody, website: "https://spam.example" }, "10.0.0.5"),
		);

		expect(response.status).toBe(200);
		expect(await json(response)).toEqual({ ok: true });
		expect(sendMail).not.toHaveBeenCalled();
	});

	it("returns a retryable 400 when the form was submitted too fast", async () => {
		const response = await POST(
			request(
				{ ...validBody, elapsedMs: MIN_FILL_DURATION_MS - 1 },
				"10.0.0.6",
			),
		);

		expect(response.status).toBe(400);
		expect(String((await json(response)).error)).toMatch(
			/take another moment/i,
		);
		expect(sendMail).not.toHaveBeenCalled();
	});

	it("returns 429 once an address exceeds its budget", async () => {
		for (let attempt = 0; attempt < RATE_LIMIT_MAX; attempt += 1) {
			const allowed = await POST(request(validBody, "10.0.0.7"));
			expect(allowed.status).toBe(200);
		}

		const limited = await POST(request(validBody, "10.0.0.7"));

		expect(limited.status).toBe(429);
		expect(sendMail).toHaveBeenCalledTimes(RATE_LIMIT_MAX);
	});

	it("returns 502 when the send fails, so nothing is silently lost", async () => {
		sendMail.mockRejectedValueOnce(new Error("connection refused"));

		const response = await POST(request(validBody, "10.0.0.8"));

		expect(response.status).toBe(502);
		expect(String((await json(response)).error)).toMatch(/could not send/i);
	});

	it("omits Reply-To when the submitter gave no email", async () => {
		await POST(request({ ...validBody, email: "" }, "10.0.0.9"));

		expect(sendMail).toHaveBeenCalledWith(
			expect.not.objectContaining({ replyTo: expect.anything() }),
		);
	});
});
