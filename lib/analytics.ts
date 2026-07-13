import "client-only";

import { sendGAEvent } from "@next/third-parties/google";

type EventParams = Record<string, boolean | number | string | null | undefined>;

const ATTRIBUTION_KEY = "palettra:attribution";
const ONCE_PREFIX = "palettra:event:";

export type AnalyticsEvent =
	| "login"
	| "logout"
	| "login_error"
	| "sign_in_dialog_opened"
	| "palette_saved"
	| "palette_save_failed"
	| "palette_opened"
	| "palette_deleted"
	| "palette_renamed"
	| "palette_mutation_failed"
	| "collection_opened"
	| "account_deleted"
	| "export_dialog_opened"
	| "export_copied"
	| "export_downloaded"
	| "import_opened"
	| "palette_imported"
	| "stitch_imported"
	| "random_palette"
	| "generator_reset"
	| "landing_cta_clicked"
	| "palette_activated"
	| "palette_edit_started"
	| "share_copied"
	| "preview_opened"
	| "color_role_added"
	| "color_role_removed"
	| "color_role_edited"
	| "typography_changed"
	| "font_selected"
	| "CLS"
	| "FCP"
	| "FID"
	| "INP"
	| "LCP"
	| "TTFB"
	| "Next.js-hydration"
	| "Next.js-route-change-to-render"
	| "Next.js-render";

function safeSessionGet(key: string): string | null {
	try {
		return window.sessionStorage.getItem(key);
	} catch {
		return null;
	}
}

function safeSessionSet(key: string, value: string): void {
	try {
		window.sessionStorage.setItem(key, value);
	} catch {
		// Analytics must never block the product when storage is unavailable.
	}
}

/** Persist the first campaign context seen in this browser session. */
export function getAttributionParams(): EventParams {
	if (typeof window === "undefined") {
		return {};
	}
	const stored = safeSessionGet(ATTRIBUTION_KEY);
	if (stored) {
		try {
			return JSON.parse(stored) as EventParams;
		} catch {
			// Replace malformed storage with the current landing context.
		}
	}

	const search = new URLSearchParams(window.location.search);
	const params: EventParams = {
		landing_path: window.location.pathname,
	};
	for (const key of [
		"utm_source",
		"utm_medium",
		"utm_campaign",
		"utm_content",
		"utm_term",
	] as const) {
		const value = search.get(key);
		if (value) params[key] = value.slice(0, 100);
	}
	if (document.referrer) {
		try {
			params.referrer_host = new URL(document.referrer).hostname;
		} catch {
			// Ignore malformed referrers supplied by the browser.
		}
	}
	safeSessionSet(ATTRIBUTION_KEY, JSON.stringify(params));
	return params;
}

export function trackEvent(name: AnalyticsEvent, params?: EventParams): void {
	if (
		!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
		typeof window === "undefined"
	) {
		return;
	}
	sendGAEvent("event", name, {
		...getAttributionParams(),
		...(params ?? {}),
	});
}

/** Emit a product event at most once per browser session. */
export function trackEventOnce(
	key: string,
	name: AnalyticsEvent,
	params?: EventParams,
): void {
	if (typeof window === "undefined") return;
	const storageKey = `${ONCE_PREFIX}${key}`;
	if (safeSessionGet(storageKey)) return;
	trackEvent(name, params);
	safeSessionSet(storageKey, "1");
}
