import { describe, expect, it } from "vitest";

import {
	MESSAGE_MAX_LENGTH,
	MIN_FILL_DURATION_MS,
	buildFeedbackEmail,
	isFeedbackConfigured,
	readSmtpConfig,
	screenFeedbackRequest,
	validateFeedbackRequest,
} from "@/lib/feedback";
import { createRateLimiter } from "@/lib/rate-limit";

const validBody = {
	type: "feature",
	message: "Please add a Sass variables export alongside the CSS one.",
	email: "someone@example.com",
	website: "",
	elapsedMs: 12_000,
};

const emailConfig = {
	toAddress: "operator@example.com",
	fromAddress: "transport@gmail.com",
	fromName: "Palettra Feedback",
};

describe("screenFeedbackRequest", () => {
	it("discards silently when the honeypot is filled", () => {
		expect(screenFeedbackRequest({ ...validBody, website: "spam" })).toBe(
			"discard",
		);
	});

	it("reports a too-fast submit so a human can retry", () => {
		expect(
			screenFeedbackRequest({
				...validBody,
				elapsedMs: MIN_FILL_DURATION_MS - 1,
			}),
		).toBe("too-fast");
	});

	it("treats a missing duration as too fast", () => {
		expect(screenFeedbackRequest({ type: "bug" })).toBe("too-fast");
	});

	it("accepts a normally-paced submission", () => {
		expect(screenFeedbackRequest(validBody)).toBe("accept");
	});
});

describe("validateFeedbackRequest", () => {
	it("accepts a valid submission and trims the message", () => {
		const result = validateFeedbackRequest({
			...validBody,
			message: `  ${validBody.message}  `,
		});

		expect(result).toEqual({
			ok: true,
			submission: {
				type: "feature",
				message: validBody.message,
				email: "someone@example.com",
			},
		});
	});

	it("accepts a submission with no email", () => {
		const result = validateFeedbackRequest({ ...validBody, email: "" });

		expect(result.ok).toBe(true);
		expect(result.ok && result.submission.email).toBe("");
	});

	it("rejects an unknown type", () => {
		const result = validateFeedbackRequest({ ...validBody, type: "praise" });

		expect(result).toEqual({
			ok: false,
			error: "Choose what kind of message this is",
		});
	});

	it("rejects a message below the minimum length", () => {
		const result = validateFeedbackRequest({
			...validBody,
			message: "pls fix",
		});

		expect(result.ok).toBe(false);
	});

	it("rejects a message above the maximum length", () => {
		const result = validateFeedbackRequest({
			...validBody,
			message: "a".repeat(MESSAGE_MAX_LENGTH + 1),
		});

		expect(result.ok).toBe(false);
	});

	it("rejects a malformed email", () => {
		const result = validateFeedbackRequest({
			...validBody,
			email: "not-an-email",
		});

		expect(result).toEqual({
			ok: false,
			error: "That email address does not look right",
		});
	});

	it("rejects an email carrying a header-injection newline", () => {
		const result = validateFeedbackRequest({
			...validBody,
			email: "a@b.com\nBcc: victim@example.com",
		});

		expect(result.ok).toBe(false);
	});

	it("rejects a non-object body", () => {
		expect(validateFeedbackRequest(null).ok).toBe(false);
		expect(validateFeedbackRequest("nope").ok).toBe(false);
	});
});

describe("buildFeedbackEmail", () => {
	it("sends from the transport account and replies to the submitter", () => {
		const email = buildFeedbackEmail(
			{
				type: "feature",
				message: "Add a Sass export",
				email: "someone@example.com",
			},
			emailConfig,
		);

		expect(email.from).toBe('"Palettra Feedback" <transport@gmail.com>');
		expect(email.to).toBe("operator@example.com");
		expect(email.replyTo).toBe("someone@example.com");
	});

	it("omits Reply-To when no email was given", () => {
		const email = buildFeedbackEmail(
			{ type: "bug", message: "Swatches overlap at 320px", email: "" },
			emailConfig,
		);

		expect(email.replyTo).toBeUndefined();
		expect(email.text).toContain("From: not provided");
	});

	it("prefixes the subject with the type", () => {
		const email = buildFeedbackEmail(
			{ type: "bug", message: "Swatches overlap at 320px", email: "" },
			emailConfig,
		);

		expect(email.subject).toBe(
			"[Palettra] Bug report — Swatches overlap at 320px",
		);
	});

	it("flattens newlines and truncates a long subject summary", () => {
		const email = buildFeedbackEmail(
			{
				type: "general",
				message: `line one\nline two ${"x".repeat(100)}`,
				email: "",
			},
			emailConfig,
		);

		expect(email.subject).not.toContain("\n");
		expect(email.subject.endsWith("…")).toBe(true);
		expect(email.subject.length).toBeLessThanOrEqual(
			"[Palettra] Feedback — ".length + 60,
		);
	});

	it("keeps the full message in the body", () => {
		const email = buildFeedbackEmail(
			{ type: "general", message: "line one\nline two", email: "" },
			emailConfig,
		);

		expect(email.text).toContain("line one\nline two");
		expect(email.text).toContain("Type: Feedback");
	});
});

describe("readSmtpConfig", () => {
	const configured = {
		SMTP_HOST: "smtp.gmail.com",
		SMTP_USER: "transport@gmail.com",
		SMTP_PASSWORD: "app-password",
	};

	it("returns null unless host, user, and password are all present", () => {
		expect(readSmtpConfig({})).toBeNull();
		expect(readSmtpConfig({ ...configured, SMTP_HOST: "" })).toBeNull();
		expect(readSmtpConfig({ ...configured, SMTP_USER: "" })).toBeNull();
		expect(readSmtpConfig({ ...configured, SMTP_PASSWORD: "" })).toBeNull();
		expect(isFeedbackConfigured(configured)).toBe(true);
		expect(isFeedbackConfigured({})).toBe(false);
	});

	it("defaults the port to 587 with STARTTLS", () => {
		expect(readSmtpConfig(configured)).toMatchObject({
			port: 587,
			secure: false,
		});
	});

	it("uses implicit TLS on port 465", () => {
		expect(readSmtpConfig({ ...configured, SMTP_PORT: "465" })).toMatchObject({
			port: 465,
			secure: true,
		});
	});

	it("defaults the destination to the transport account", () => {
		expect(readSmtpConfig(configured)?.toAddress).toBe("transport@gmail.com");
		expect(
			readSmtpConfig({ ...configured, FEEDBACK_TO_EMAIL: "me@outlook.com" })
				?.toAddress,
		).toBe("me@outlook.com");
	});

	it("defaults the From display name", () => {
		expect(readSmtpConfig(configured)?.fromName).toBe("Palettra Feedback");
	});
});

describe("createRateLimiter", () => {
	it("allows up to the limit and then refuses", () => {
		const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });

		expect(limiter.check("ip", 0)).toBe(true);
		expect(limiter.check("ip", 1)).toBe(true);
		expect(limiter.check("ip", 2)).toBe(true);
		expect(limiter.check("ip", 3)).toBe(false);
	});

	it("counts each key separately", () => {
		const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });

		expect(limiter.check("a", 0)).toBe(true);
		expect(limiter.check("b", 0)).toBe(true);
		expect(limiter.check("a", 0)).toBe(false);
	});

	it("lets the window slide", () => {
		const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });

		expect(limiter.check("ip", 0)).toBe(true);
		expect(limiter.check("ip", 500)).toBe(false);
		expect(limiter.check("ip", 1001)).toBe(true);
	});

	it("evicts the oldest key past the cap", () => {
		const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });

		limiter.check("a", 0);
		limiter.check("b", 0);
		limiter.check("c", 0);

		// "a" was evicted, so its budget is fresh again.
		expect(limiter.check("a", 0)).toBe(true);
		expect(limiter.check("c", 0)).toBe(false);
	});
});
