import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { generatePalette } from "@/lib/color";
import { defaultTypography } from "@/lib/typography";
import {
	DEFAULT_PREVIEW_KEY,
	isPreviewKey,
	PREVIEW_TEMPLATES,
} from "@/components/generator/previews/index";

describe("preview registry", () => {
	it("registers 10 templates with unique keys", () => {
		expect(PREVIEW_TEMPLATES).toHaveLength(10);
		const keys = PREVIEW_TEMPLATES.map((t) => t.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("has a default key present in the registry", () => {
		expect(PREVIEW_TEMPLATES.some((t) => t.key === DEFAULT_PREVIEW_KEY)).toBe(
			true,
		);
	});

	it("validates preview keys", () => {
		expect(isPreviewKey("dashboard")).toBe(true);
		expect(isPreviewKey("charts")).toBe(true);
		expect(isPreviewKey("nope")).toBe(false);
		expect(isPreviewKey(null)).toBe(false);
		expect(isPreviewKey(undefined)).toBe(false);
	});

	it("renders every template without throwing", () => {
		const typography = defaultTypography();
		const palettes = [
			generatePalette("#a543bc", "Primary"),
			generatePalette("#1e88e5", "Secondary"),
		];
		for (const { key, Component } of PREVIEW_TEMPLATES) {
			const { unmount } = render(
				<div style={{ ["--primary-500" as string]: "#a543bc" }}>
					<Component typography={typography} palettes={palettes} />
				</div>,
			);
			expect(document.body, key).toBeTruthy();
			unmount();
		}
	});
});
