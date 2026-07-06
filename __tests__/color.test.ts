import { describe, expect, it } from "vitest";

import {
	colorNameFromHue,
	generatePalette,
	hexToHsl,
	hslToHex,
	isValidHex,
	nearestShade,
	normalizeHex,
	SHADES,
	contrastGrade,
	contrastRatio,
	previewThemeVars,
	toCssVars,
	toFigmaTokens,
	toHexList,
	toTailwindV3,
	toTailwindV4Oklch,
} from "@/lib/color";
import { defaultTypography } from "@/lib/typography";

describe("normalizeHex", () => {
	it("expands shorthand and lowercases", () => {
		expect(normalizeHex("#abc")).toBe("#aabbcc");
		expect(normalizeHex("ABC")).toBe("#aabbcc");
		expect(normalizeHex("A543BC")).toBe("#a543bc");
		expect(normalizeHex("  #a543bc  ")).toBe("#a543bc");
	});

	it("rejects invalid input", () => {
		expect(normalizeHex("#xyz")).toBeNull();
		expect(normalizeHex("#12")).toBeNull();
		expect(normalizeHex("#1234567")).toBeNull();
		expect(normalizeHex("")).toBeNull();
	});
});

describe("isValidHex", () => {
	it("matches normalizeHex", () => {
		expect(isValidHex("#a543bc")).toBe(true);
		expect(isValidHex("nope")).toBe(false);
	});
});

describe("hsl round-trip", () => {
	it("preserves a color within rounding", () => {
		expect(hslToHex(hexToHsl("#a543bc"))).toBe("#a543bc");
	});

	it("reads achromatic gray with no saturation", () => {
		expect(hexToHsl("#808080").s).toBeLessThan(1);
	});
});

describe("nearestShade", () => {
	it("maps lightness to the closest stop", () => {
		expect(nearestShade(52)).toBe(500);
		expect(nearestShade(97)).toBe(50);
		expect(nearestShade(15)).toBe(950);
	});
});

describe("colorNameFromHue", () => {
	it("names hues and detects gray", () => {
		expect(colorNameFromHue(hexToHsl("#a543bc"))).toBe("purple");
		expect(colorNameFromHue(hexToHsl("#2563eb"))).toBe("blue");
		expect(colorNameFromHue(hexToHsl("#808080"))).toBe("gray");
	});
});

describe("generatePalette", () => {
	const palette = generatePalette("#a543bc");

	it("produces exactly 11 ordered stops", () => {
		expect(palette.shades.map((s) => s.shade)).toEqual([...SHADES]);
	});

	it("anchors the input exactly at one stop", () => {
		const anchors = palette.shades.filter((s) => s.isAnchor);
		expect(anchors).toHaveLength(1);
		expect(palette.anchorShade).toBe(500);
		expect(anchors[0].hex).toBe("#a543bc");
	});

	it("emits valid lowercase hex for every stop", () => {
		for (const shade of palette.shades) {
			expect(shade.hex).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it("anchors very light input at 50 and preserves it", () => {
		const light = generatePalette("#fafafa");
		expect(light.anchorShade).toBe(50);
		expect(light.shades[0].hex).toBe("#fafafa");
	});

	it("auto-names from hue and accepts an override", () => {
		expect(palette.name).toBe("purple");
		expect(generatePalette("#a543bc", "Brand").name).toBe("Brand");
	});
});

describe("export builders", () => {
	const primary = generatePalette("#a543bc", "Primary");
	const secondary = generatePalette("#1e88e5", "Secondary");

	it("emits Tailwind v3 with a block per role", () => {
		const out = toTailwindV3([primary, secondary]);
		expect(out).toContain('"primary": {');
		expect(out).toContain('"secondary": {');
		expect(out).toContain('"500": "#a543bc"');
	});

	it("emits Tailwind v4 oklch tokens for every role", () => {
		const out = toTailwindV4Oklch([primary, secondary]);
		expect(out).toContain("--color-primary-500:");
		expect(out).toContain("--color-secondary-500:");
		expect(out).toMatch(/oklch\([\d.]+ [\d.]+ [\d.]+\)/);
	});

	it("emits CSS variables for every role", () => {
		const out = toCssVars([primary, secondary]);
		expect(out).toContain("--primary-500: #a543bc;");
		expect(out).toContain("--secondary-500: #1e88e5;");
	});

	it("lists hexes grouped by role", () => {
		const out = toHexList([primary, secondary]);
		expect(out).toContain("primary");
		expect(out).toContain("secondary");
		expect(out).toContain("500 #a543bc");
	});

	it("emits DTCG 2025.10 color tokens (object value) per role", () => {
		const doc = JSON.parse(toFigmaTokens([primary, secondary])) as Record<
			string,
			Record<string, { $type: string; $value: { hex: string; colorSpace: string } }>
		>;
		expect(Object.keys(doc)).toEqual(["primary", "secondary"]);
		expect(Object.keys(doc.primary)).toEqual(SHADES.map(String));
		expect(doc.primary["500"].$type).toBe("color");
		expect(doc.primary["500"].$value.hex).toBe("#a543bc");
		expect(doc.primary["500"].$value.colorSpace).toBe("srgb");
		expect(doc.secondary["500"].$value.hex).toBe("#1e88e5");
	});

	it("disambiguates roles that slug to the same name", () => {
		const dupe = generatePalette("#1e88e5", "Primary");
		const doc = JSON.parse(toFigmaTokens([primary, dupe])) as Record<
			string,
			unknown
		>;
		expect(Object.keys(doc)).toEqual(["primary", "primary-2"]);
	});

	it("merges typography groups alongside colors when provided", () => {
		const doc = JSON.parse(
			toFigmaTokens([primary], defaultTypography()),
		) as Record<string, Record<string, { $type: string; $value: unknown }>>;
		expect((doc.primary["500"].$value as { hex: string }).hex).toBe("#a543bc");
		expect(doc.fontFamily.sans).toEqual({
			$type: "fontFamily",
			$value: "Inter",
		});
		expect(doc.fontSize.base).toEqual({
			$type: "dimension",
			$value: { value: 16, unit: "px" },
		});
	});

	it("emits colors only when typography is omitted", () => {
		const doc = JSON.parse(toFigmaTokens([primary])) as Record<string, unknown>;
		expect(Object.keys(doc)).toEqual(["primary"]);
	});
});

describe("contrast", () => {
	it("computes the WCAG ratio symmetrically", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
		expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
		expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 1);
	});

	it("grades ratios by WCAG thresholds", () => {
		expect(contrastGrade(21)).toBe("AAA");
		expect(contrastGrade(5)).toBe("AA");
		expect(contrastGrade(3.5)).toBe("AA Large");
		expect(contrastGrade(1.2)).toBe("Fail");
	});
});

describe("previewThemeVars", () => {
	it("aliases roles to positional semantic names regardless of role name", () => {
		const a = generatePalette("#a543bc", "Primary");
		const b = generatePalette("#1e88e5", "Color 2");
		const c = generatePalette("#22c55e", "Brandy");
		const vars = previewThemeVars([a, b, c]);

		// 2nd/3rd roles resolve via semantic aliases even though they are renamed,
		// matching their name-based slug values.
		expect(vars["--secondary-500"]).toBe(vars["--color-2-500"]);
		expect(vars["--tertiary-500"]).toBe(vars["--brandy-500"]);
		expect(vars["--secondary-500"]).toBe("#1e88e5");
		expect(vars["--primary-500"]).toBe("#a543bc");
	});
});
