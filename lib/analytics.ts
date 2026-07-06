import "client-only";

import { sendGAEvent } from "@next/third-parties/google";

type EventParams = Record<string, boolean | number | string | null | undefined>;

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

export function trackEvent(
	name: AnalyticsEvent,
	params?: EventParams,
): void {
	if (
		!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
		typeof window === "undefined"
	) {
		return;
	}
	sendGAEvent("event", name, params ?? {});
}
