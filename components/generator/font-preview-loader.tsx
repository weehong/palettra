"use client";

import { useEffect } from "react";

import { googleFontsHref } from "@/lib/fonts";

const STYLESHEET_ID = "curated-google-fonts";

/**
 * Loads the curated Google Fonts at runtime by injecting a stylesheet `<link>`
 * into the document head (idempotent by id), so the typography picker and the
 * preview specimens render in the selected typefaces. Renders nothing.
 */
export function FontPreviewLoader(): null {
	// Computed during render so the effect re-runs whenever the curated list
	// changes (e.g. Fast Refresh after editing lib/fonts.ts).
	const href = googleFontsHref();

	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}
		const existing = document.getElementById(STYLESHEET_ID);
		if (existing instanceof HTMLLinkElement) {
			// The curated list can change under an already-injected link (e.g.
			// Fast Refresh after editing lib/fonts.ts); re-point it so newly
			// added families actually load instead of rendering as fallbacks.
			if (existing.href !== href) {
				existing.href = href;
			}
			return;
		}
		const preconnect = document.createElement("link");
		preconnect.rel = "preconnect";
		preconnect.href = "https://fonts.gstatic.com";
		preconnect.crossOrigin = "anonymous";
		document.head.appendChild(preconnect);

		const stylesheet = document.createElement("link");
		stylesheet.id = STYLESHEET_ID;
		stylesheet.rel = "stylesheet";
		stylesheet.href = href;
		document.head.appendChild(stylesheet);
	}, [href]);

	return null;
}
