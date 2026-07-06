import {
	DEFAULT_OPENROUTER_MODEL,
	OPENROUTER_URL,
	buildSiteThemeMessages,
	extractJsonObject,
	sanitizeAiSiteTheme,
	validateAiSiteThemeRequest,
} from "@/lib/ai-site-theme";
import { siteConfig } from "@/lib/site-config";

type OpenRouterResponse = {
	choices?: Array<{ message?: { content?: unknown } }>;
};

export async function POST(request: Request): Promise<Response> {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		return Response.json({ error: "AI not configured" }, { status: 503 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid request body" }, { status: 400 });
	}

	const validation = validateAiSiteThemeRequest(body);
	if (!validation.ok) {
		return Response.json({ error: validation.error }, { status: 400 });
	}

	const model =
		validation.model || process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;

	let response: Response;
	try {
		response = await fetch(OPENROUTER_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer": siteConfig.url,
				"X-Title": siteConfig.name,
			},
			body: JSON.stringify({
				model,
				max_tokens: 2048,
				messages: buildSiteThemeMessages({
					rampVars: validation.rampVars,
					roles: validation.roles,
				}),
			}),
		});
	} catch {
		return Response.json(
			{ error: "Could not reach OpenRouter" },
			{ status: 502 },
		);
	}

	if (!response.ok) {
		return Response.json(
			{ error: `OpenRouter error (${response.status})` },
			{ status: 502 },
		);
	}

	const data = (await response.json().catch(() => null)) as
		| OpenRouterResponse
		| null;
	const content = data?.choices?.[0]?.message?.content;
	const parsed = typeof content === "string" ? extractJsonObject(content) : null;
	if (!parsed) {
		return Response.json({ error: "Invalid AI response" }, { status: 502 });
	}

	const theme = sanitizeAiSiteTheme(parsed, validation.rampVars);
	if (
		Object.keys(theme.light).length === 0 &&
		Object.keys(theme.dark).length === 0
	) {
		return Response.json({ error: "No usable theme tokens" }, { status: 502 });
	}
	return Response.json(theme);
}
