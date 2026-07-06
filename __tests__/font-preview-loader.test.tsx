import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { FontPreviewLoader } from "@/components/generator/font-preview-loader";
import { googleFontsHref } from "@/lib/fonts";

const STYLESHEET_ID = "curated-google-fonts";

afterEach(() => {
	cleanup();
	document.getElementById(STYLESHEET_ID)?.remove();
	document
		.querySelectorAll('link[rel="preconnect"]')
		.forEach((element) => element.remove());
});

describe("FontPreviewLoader", () => {
	it("injects the curated stylesheet on mount", () => {
		render(<FontPreviewLoader />);

		const stylesheet = document.getElementById(STYLESHEET_ID);
		expect(stylesheet).toBeInstanceOf(HTMLLinkElement);
		expect(stylesheet).toHaveAttribute("href", googleFontsHref());
	});

	it("does not duplicate the stylesheet across mounts", () => {
		render(<FontPreviewLoader />);
		render(<FontPreviewLoader />);

		expect(
			document.querySelectorAll(`link#${STYLESHEET_ID}`),
		).toHaveLength(1);
	});

	it("refreshes a stale stylesheet href when the curated list changed", () => {
		// Simulate a link injected before a font was added to CURATED_FONTS
		// (e.g. dev-server Fast Refresh after editing lib/fonts.ts).
		const stale = document.createElement("link");
		stale.id = STYLESHEET_ID;
		stale.rel = "stylesheet";
		stale.href =
			"https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap";
		document.head.appendChild(stale);

		render(<FontPreviewLoader />);

		expect(document.getElementById(STYLESHEET_ID)).toHaveAttribute(
			"href",
			googleFontsHref(),
		);
	});
});
