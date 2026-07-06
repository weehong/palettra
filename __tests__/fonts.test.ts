import { describe, expect, it } from "vitest";

import { CURATED_FONTS, fontStack, googleFontsHref } from "@/lib/fonts";

describe("CURATED_FONTS", () => {
	it("includes the typography defaults and has unique names", () => {
		const names = CURATED_FONTS.map((f) => f.name);
		expect(names).toContain("Inter");
		expect(names).toContain("Georgia");
		expect(names).toContain("JetBrains Mono");
		expect(names).toContain("Manrope");
		expect(new Set(names).size).toBe(names.length);
	});
});

describe("fontStack", () => {
	it("appends a category-appropriate fallback", () => {
		expect(fontStack("Inter")).toBe("'Inter', sans-serif");
		expect(fontStack("Lora")).toBe("'Lora', serif");
		expect(fontStack("Fira Code")).toBe("'Fira Code', monospace");
		// Unknown names default to the sans fallback.
		expect(fontStack("Whatever")).toBe("'Whatever', sans-serif");
	});
});

describe("googleFontsHref", () => {
	const href = googleFontsHref();

	it("requests curated families with weights and swap display", () => {
		expect(href).toContain(
			"family=Inter:wght@100;200;300;400;500;600;700;800;900",
		);
		expect(href).toContain("family=JetBrains+Mono:wght@");
		expect(href).toContain("display=swap");
	});

	it("excludes system fonts", () => {
		expect(href).not.toContain("Georgia");
	});
});
