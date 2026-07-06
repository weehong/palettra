import { describe, expect, it } from "vitest";

import {
	decodeTypography,
	defaultTypography,
	encodeTypography,
	FONT_WEIGHTS,
	generateTypeScale,
	isDefaultTypography,
	LINE_HEIGHTS,
	SIZE_STEPS,
	TEXT_STYLES,
	typographyToFigmaGroups,
} from "@/lib/typography";

describe("generateTypeScale", () => {
	it("derives the named scale from base and ratio", () => {
		const scale = generateTypeScale(16, 1.25);
		expect(scale.base).toBe(16);
		expect(scale.lg).toBe(20);
		expect(scale.sm).toBe(13);
		expect(Object.keys(scale)).toEqual(SIZE_STEPS.map((s) => s.name));
	});

	it("increases monotonically across the stops", () => {
		const scale = generateTypeScale(16, 1.25);
		const values = SIZE_STEPS.map((s) => scale[s.name]);
		for (let i = 1; i < values.length; i += 1) {
			expect(values[i]).toBeGreaterThan(values[i - 1]);
		}
	});
});

describe("defaultTypography / isDefaultTypography", () => {
	it("recognizes the default and rejects edits", () => {
		const def = defaultTypography();
		expect(isDefaultTypography(def)).toBe(true);
		expect(isDefaultTypography({ ...def, baseSize: 18 })).toBe(false);
		expect(
			isDefaultTypography({ ...def, fonts: { ...def.fonts, sans: "Roboto" } }),
		).toBe(false);
	});
});

describe("encode/decode typography", () => {
	it("round-trips including family names with spaces", () => {
		const t = {
			fonts: {
				heading: "Space Grotesk",
				sans: "IBM Plex Sans",
				serif: "Source Serif",
				mono: "Fira Code",
			},
			extraFamilies: ["Montserrat", "Playfair Display"],
			baseSize: 18,
			ratio: 1.333,
		};
		expect(decodeTypography(encodeTypography(t))).toEqual(t);
	});

	it("falls back to defaults for empty or malformed input", () => {
		expect(decodeTypography(null)).toEqual(defaultTypography());
		expect(decodeTypography("")).toEqual(defaultTypography());
		const partial = decodeTypography("Roboto");
		expect(partial.fonts.sans).toBe("Roboto");
		expect(partial.baseSize).toBe(defaultTypography().baseSize);
		expect(partial.ratio).toBe(defaultTypography().ratio);
	});

	it("decodes pre-heading URLs with the heading falling back to sans", () => {
		const legacy = "Manrope~Lora~Fira%20Code~16~1.25";
		const decoded = decodeTypography(legacy);
		expect(decoded.fonts.sans).toBe("Manrope");
		expect(decoded.fonts.heading).toBe("Manrope");
		expect(decoded.fonts.serif).toBe("Lora");
	});

	it("decodes appended extra font families without breaking older fields", () => {
		const decoded = decodeTypography(
			"Inter~Georgia~JetBrains%20Mono~16~1.25~Inter~Montserrat~Playfair%20Display",
		);
		expect(decoded.extraFamilies).toEqual(["Montserrat", "Playfair Display"]);
	});
});

describe("TEXT_STYLES", () => {
	const scale = generateTypeScale(16, 1.25);

	it("references valid size, weight, and line-height tokens", () => {
		expect(TEXT_STYLES.length).toBeGreaterThan(0);
		for (const style of TEXT_STYLES) {
			expect(scale[style.size]).toBeTypeOf("number");
			expect(FONT_WEIGHTS[style.weight]).toBeTypeOf("number");
			expect(LINE_HEIGHTS[style.lineHeight]).toBeTypeOf("number");
		}
	});
});

describe("typographyToFigmaGroups", () => {
	const groups = typographyToFigmaGroups(defaultTypography());

	it("emits the four DTCG token groups", () => {
		expect(Object.keys(groups)).toEqual([
			"fontFamily",
			"fontSize",
			"fontWeight",
			"lineHeight",
		]);
	});

	it("tags every token with the right $type and value", () => {
		expect(groups.fontFamily.heading).toEqual({
			$type: "fontFamily",
			$value: "Inter",
		});
		expect(groups.fontFamily.sans).toEqual({
			$type: "fontFamily",
			$value: "Inter",
		});
		expect(groups.fontSize.base).toEqual({
			$type: "dimension",
			$value: { value: 16, unit: "px" },
		});
		expect(groups.fontWeight.semibold).toEqual({
			$type: "fontWeight",
			$value: 600,
		});
		expect(groups.lineHeight.tight).toEqual({ $type: "number", $value: 1.25 });
	});

	it("emits extra font family tokens", () => {
		const groupsWithExtra = typographyToFigmaGroups({
			...defaultTypography(),
			extraFamilies: ["Montserrat", "Lora"],
		});
		expect(groupsWithExtra.fontFamily.extra1).toEqual({
			$type: "fontFamily",
			$value: "Montserrat",
		});
		expect(groupsWithExtra.fontFamily.extra2).toEqual({
			$type: "fontFamily",
			$value: "Lora",
		});
	});
});
