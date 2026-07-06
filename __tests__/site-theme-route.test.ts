import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_OPENROUTER_MODEL, OPENROUTER_URL } from "@/lib/ai-site-theme";
import { POST } from "@/app/api/site-theme/route";

const validBody = {
	rampVars: {
		"--primary-600": "#2563eb",
		"--neutral-50": "#f8fafc",
		"--neutral-900": "#0f172a",
	},
	roles: [{ name: "Primary", slug: "primary", preset: null }],
};

function request(body: unknown): Request {
	return new Request("http://localhost/api/site-theme", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

async function json(response: Response): Promise<Record<string, unknown>> {
	return (await response.json()) as Record<string, unknown>;
}

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe("site theme AI route", () => {
	it("returns 503 when OpenRouter is not configured", async () => {
		vi.stubEnv("OPENROUTER_API_KEY", "");

		const response = await POST(request(validBody));

		expect(response.status).toBe(503);
		expect(await json(response)).toHaveProperty("error");
	});

	it.each([
		["bad body", "not json"],
		[
			"oversized role name",
			{
				...validBody,
				roles: [{ name: "x".repeat(49), slug: "primary", preset: null }],
			},
		],
		[
			"oversized role preset",
			{
				...validBody,
				roles: [{ name: "Primary", slug: "primary", preset: "x".repeat(49) }],
			},
		],
		[
			"non-hex ramp value",
			{ ...validBody, rampVars: { "--primary-600": "red" } },
		],
		["bad ramp key", { ...validBody, rampVars: { "primary-600": "#2563eb" } }],
	])("returns 400 for %s", async (_label, body) => {
		vi.stubEnv("OPENROUTER_API_KEY", "test-key");

		const response = await POST(request(body));

		expect(response.status).toBe(400);
	});

	it("returns 502 when OpenRouter fails", async () => {
		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("bad", { status: 500 })),
		);

		const response = await POST(request(validBody));

		expect(response.status).toBe(502);
	});

	it("returns 502 when completion sanitizes to empty schemes", async () => {
		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					choices: [
						{
							message: { content: '{"light":{"--unknown":"#fff"},"dark":{}}' },
						},
					],
				}),
			),
		);

		const response = await POST(request(validBody));

		expect(response.status).toBe(502);
	});

	it("returns sanitized hex values and calls OpenRouter with configured headers", async () => {
		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "");
		const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
			void args;
			return Response.json({
				choices: [
					{
						message: {
							content:
								'{"light":{"--background":"var(--neutral-50)","--primary":"var(--primary-600)"},"dark":{"--background":"var(--neutral-900)"}}',
						},
					},
				],
			});
		});
		vi.stubGlobal("fetch", fetchMock);

		const response = await POST(request({ ...validBody, model: "" }));

		expect(response.status).toBe(200);
		expect(await json(response)).toEqual({
			light: { "--background": "#f8fafc", "--primary": "#2563eb" },
			dark: { "--background": "#0f172a" },
		});
		expect(fetchMock).toHaveBeenCalledWith(
			OPENROUTER_URL,
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({
					Authorization: "Bearer test-key",
					"Content-Type": "application/json",
					"HTTP-Referer": expect.any(String),
					"X-Title": expect.any(String),
				}),
			}),
		);
		const payload = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as {
			model: string;
			max_tokens: number;
		};
		expect(payload.model).toBe(DEFAULT_OPENROUTER_MODEL);
		expect(payload.max_tokens).toBe(2048);
	});
});
