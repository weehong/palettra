/**
 * Typography token model.
 *
 * The editable surface is deliberately small: four font families (heading,
 * sans/body, serif, mono) plus a base size and a modular-scale ratio. The named size scale (xs…4xl) is *derived*
 * from `base * ratio^step`, so two numbers drive a whole scale. Font weights and
 * line-heights are fixed standard sets — emitted as tokens but not user-edited.
 *
 * Everything here is pure so it can be reused by the editor UI, the URL
 * round-trip, and the Figma (DTCG) export without duplication.
 */

export type FontFamilies = {
	/** Display face for headlines/titles; defaults to the sans family. */
	heading: string;
	sans: string;
	serif: string;
	mono: string;
};

export type Typography = {
	fonts: FontFamilies;
	/** Additional font families shown in the specimen and exported as tokens. */
	extraFamilies?: Array<string>;
	/** Base font size in px; the `base` stop of the scale. */
	baseSize: number;
	/** Modular-scale ratio applied per step. */
	ratio: number;
};

export const DEFAULT_TYPOGRAPHY: Typography = {
	fonts: {
		heading: "Inter",
		sans: "Inter",
		serif: "Georgia",
		mono: "JetBrains Mono",
	},
	extraFamilies: [],
	baseSize: 16,
	ratio: 1.25,
};

/** Named size stops and their step offset from the base (step 0). */
export const SIZE_STEPS: ReadonlyArray<{ name: string; step: number }> = [
	{ name: "xs", step: -2 },
	{ name: "sm", step: -1 },
	{ name: "base", step: 0 },
	{ name: "lg", step: 1 },
	{ name: "xl", step: 2 },
	{ name: "2xl", step: 3 },
	{ name: "3xl", step: 4 },
	{ name: "4xl", step: 5 },
];

/** Standard font weights, emitted as tokens (not individually editable). */
export const FONT_WEIGHTS: Readonly<Record<string, number>> = {
	regular: 400,
	medium: 500,
	semibold: 600,
	bold: 700,
};

/** Tailwind's unitless line-height multipliers, emitted as tokens. */
export const LINE_HEIGHTS: Readonly<Record<string, number>> = {
	none: 1,
	tight: 1.25,
	snug: 1.375,
	normal: 1.5,
	relaxed: 1.625,
	loose: 2,
};

/**
 * Semantic text styles shown in the Design-system specimen cards, each mapping a
 * role to a size step, a weight, and a line-height token.
 */
export const TEXT_STYLES: ReadonlyArray<{
	label: string;
	size: string;
	weight: keyof typeof FONT_WEIGHTS;
	lineHeight: keyof typeof LINE_HEIGHTS;
}> = [
	{ label: "Headline", size: "4xl", weight: "bold", lineHeight: "tight" },
	{ label: "Body", size: "base", weight: "regular", lineHeight: "normal" },
	{ label: "Label", size: "sm", weight: "medium", lineHeight: "snug" },
];

/** Named modular-scale ratios offered in the editor. */
export const SCALE_RATIOS: ReadonlyArray<{ name: string; value: number }> = [
	{ name: "Minor Third", value: 1.2 },
	{ name: "Major Third", value: 1.25 },
	{ name: "Perfect Fourth", value: 1.333 },
	{ name: "Golden", value: 1.618 },
];

export function defaultTypography(): Typography {
	return {
		fonts: { ...DEFAULT_TYPOGRAPHY.fonts },
		extraFamilies: [...(DEFAULT_TYPOGRAPHY.extraFamilies ?? [])],
		baseSize: DEFAULT_TYPOGRAPHY.baseSize,
		ratio: DEFAULT_TYPOGRAPHY.ratio,
	};
}

export function isDefaultTypography(t: Typography): boolean {
	return (
		t.fonts.heading === DEFAULT_TYPOGRAPHY.fonts.heading &&
		t.fonts.sans === DEFAULT_TYPOGRAPHY.fonts.sans &&
		t.fonts.serif === DEFAULT_TYPOGRAPHY.fonts.serif &&
		t.fonts.mono === DEFAULT_TYPOGRAPHY.fonts.mono &&
		(t.extraFamilies ?? []).length === 0 &&
		t.baseSize === DEFAULT_TYPOGRAPHY.baseSize &&
		t.ratio === DEFAULT_TYPOGRAPHY.ratio
	);
}

/** Derive the named px size scale from a base size and ratio. */
export function generateTypeScale(
	base: number,
	ratio: number,
): Record<string, number> {
	const scale: Record<string, number> = {};
	for (const { name, step } of SIZE_STEPS) {
		scale[name] = Math.round(base * ratio ** step);
	}
	return scale;
}

/**
 * Serialize typography into a compact `~`-separated value:
 * `<sans>~<serif>~<mono>~<base>~<ratio>~<heading>`. Family names are
 * percent-encoded so they never contain the `~` separator. `heading` is last
 * so URLs minted before it existed still decode field-for-field.
 */
export function encodeTypography(t: Typography): string {
	return [
		encodeURIComponent(t.fonts.sans),
		encodeURIComponent(t.fonts.serif),
		encodeURIComponent(t.fonts.mono),
		String(t.baseSize),
		String(t.ratio),
		encodeURIComponent(t.fonts.heading),
		...(t.extraFamilies ?? []).map((family) => encodeURIComponent(family)),
	].join("~");
}

function parsePositive(value: string | undefined, fallback: number): number {
	const n = Number(value);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseFamily(value: string | undefined, fallback: string): string {
	if (!value) {
		return fallback;
	}
	try {
		const decoded = decodeURIComponent(value).trim();
		return decoded.length > 0 ? decoded : fallback;
	} catch {
		return fallback;
	}
}

/** Parse a `type` query value back into Typography, falling back per-field. */
export function decodeTypography(value: string | null | undefined): Typography {
	const base = defaultTypography();
	if (!value) {
		return base;
	}
	const [sans, serif, mono, size, ratio, heading, ...extra] = value.split("~");
	const sansFamily = parseFamily(sans, base.fonts.sans);
	return {
		fonts: {
			// Pre-heading URLs rendered headlines in the sans family; keep that.
			heading: parseFamily(heading, sansFamily),
			sans: sansFamily,
			serif: parseFamily(serif, base.fonts.serif),
			mono: parseFamily(mono, base.fonts.mono),
		},
		extraFamilies: extra
			.map((family) => parseFamily(family, ""))
			.filter((family) => family.length > 0),
		baseSize: parsePositive(size, base.baseSize),
		ratio: parsePositive(ratio, base.ratio),
	};
}

type FamilyToken = { $type: "fontFamily"; $value: string };
type DimensionToken = {
	$type: "dimension";
	$value: { value: number; unit: "px" };
};
type WeightToken = { $type: "fontWeight"; $value: number };
type NumberToken = { $type: "number"; $value: number };

/**
 * Build the DTCG (W3C design tokens) groups for typography: `fontFamily`,
 * `fontSize`, `fontWeight`, and `lineHeight`, conforming to the stable 2025.10
 * spec. `$type` is on every token and `dimension` values are objects
 * `{ value, unit }` (the 2025.10 form — earlier drafts used `"<n>px"` strings,
 * which current importers reject).
 */
export function typographyToFigmaGroups(
	t: Typography,
): Record<string, Record<string, unknown>> {
	const fontFamily: Record<string, FamilyToken> = {
		heading: { $type: "fontFamily", $value: t.fonts.heading },
		sans: { $type: "fontFamily", $value: t.fonts.sans },
		serif: { $type: "fontFamily", $value: t.fonts.serif },
		mono: { $type: "fontFamily", $value: t.fonts.mono },
	};
	(t.extraFamilies ?? []).forEach((family, index) => {
		fontFamily[`extra${index + 1}`] = { $type: "fontFamily", $value: family };
	});

	const scale = generateTypeScale(t.baseSize, t.ratio);
	const fontSize: Record<string, DimensionToken> = {};
	for (const { name } of SIZE_STEPS) {
		fontSize[name] = {
			$type: "dimension",
			$value: { value: scale[name], unit: "px" },
		};
	}

	const fontWeight: Record<string, WeightToken> = {};
	for (const [name, value] of Object.entries(FONT_WEIGHTS)) {
		fontWeight[name] = { $type: "fontWeight", $value: value };
	}

	const lineHeight: Record<string, NumberToken> = {};
	for (const [name, value] of Object.entries(LINE_HEIGHTS)) {
		lineHeight[name] = { $type: "number", $value: value };
	}

	return { fontFamily, fontSize, fontWeight, lineHeight };
}
