import { hsl, formatHex, oklch, clampChroma, rgb, wcagContrast } from "culori";

import type { Typography } from "@/lib/typography";
import { typographyToFigmaGroups } from "@/lib/typography";

/**
 * Tailwind color palette engine.
 *
 * Given a single base hex color this generates a full 11-stop Tailwind scale
 * (50–950), mirroring how uicolors.app works: the input is anchored to the
 * shade whose target lightness is closest, and the remaining stops are derived
 * from a per-shade lightness curve while keeping hue and saturation. The input
 * color is preserved *exactly* at its anchor stop.
 *
 * Color-space conversions are delegated to `culori`; the palette algorithm
 * itself lives here so it stays pure and unit-testable.
 */

export type Shade =
	| 50
	| 100
	| 200
	| 300
	| 400
	| 500
	| 600
	| 700
	| 800
	| 900
	| 950;

/** Hue 0–360, saturation/lightness as percentages 0–100. */
export type Hsl = { h: number; s: number; l: number };

/** Lightness 0–1, chroma 0–~0.4, hue 0–360. */
export type Oklch = { l: number; c: number; h: number };

export type PaletteShade = {
	shade: Shade;
	hex: string;
	hsl: Hsl;
	oklch: Oklch;
	isAnchor: boolean;
};

export type Palette = {
	name: string;
	baseHex: string;
	anchorShade: Shade;
	shades: ReadonlyArray<PaletteShade>;
};

export const DEFAULT_HEX = "#006d77";

export const SHADES: ReadonlyArray<Shade> = [
	50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];

/**
 * Target HSL lightness (%) per shade. Tuned so a pure mid color (L≈50) anchors
 * at 500. These are the load-bearing numbers of the visual result.
 */
export const LIGHTNESS_TARGETS: Readonly<Record<Shade, number>> = {
	50: 97,
	100: 94,
	200: 86,
	300: 76,
	400: 65,
	500: 52,
	600: 44,
	700: 37,
	800: 30,
	900: 24,
	950: 15,
};

const HEX_PATTERN = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Normalize loose hex input (`#abc`, `abc`, `AABBCC`, `#aabbcc`) to a canonical
 * lowercase `#rrggbb`, or `null` when the input is not a valid hex color.
 */
export function normalizeHex(input: string): string | null {
	const match = HEX_PATTERN.exec(input.trim());
	if (!match) {
		return null;
	}
	let digits = match[1].toLowerCase();
	if (digits.length === 3) {
		digits = digits
			.split("")
			.map((d) => d + d)
			.join("");
	}
	return `#${digits}`;
}

export function isValidHex(input: string): boolean {
	return normalizeHex(input) !== null;
}

/** Convert a hex color to degrees/percentage HSL. Achromatic hue becomes 0. */
export function hexToHsl(hex: string): Hsl {
	const c = hsl(hex);
	if (!c) {
		return { h: 0, s: 0, l: 0 };
	}
	return {
		h: c.h ?? 0,
		s: (c.s ?? 0) * 100,
		l: (c.l ?? 0) * 100,
	};
}

/** Convert degrees/percentage HSL back to a canonical lowercase hex. */
export function hslToHex(color: Hsl): string {
	return formatHex({
		mode: "hsl",
		h: color.h,
		s: color.s / 100,
		l: color.l / 100,
	});
}

/** Convert a hex color to sRGB-gamut-clamped OKLCH for Tailwind v4 export. */
export function hexToOklch(hex: string): Oklch {
	const raw = oklch(hex);
	if (!raw) {
		return { l: 0, c: 0, h: 0 };
	}
	const clamped = clampChroma(raw, "oklch");
	return {
		l: clamped.l,
		c: clamped.c,
		h: clamped.h ?? 0,
	};
}

/** Find the shade whose target lightness is closest to the given lightness. */
export function nearestShade(lightness: number): Shade {
	let best: Shade = SHADES[0];
	let bestDelta = Number.POSITIVE_INFINITY;
	for (const shade of SHADES) {
		const delta = Math.abs(LIGHTNESS_TARGETS[shade] - lightness);
		if (delta < bestDelta) {
			bestDelta = delta;
			best = shade;
		}
	}
	return best;
}

type HueBucket = { max: number; name: string };

const HUE_BUCKETS: ReadonlyArray<HueBucket> = [
	{ max: 15, name: "red" },
	{ max: 45, name: "orange" },
	{ max: 65, name: "yellow" },
	{ max: 160, name: "green" },
	{ max: 200, name: "teal" },
	{ max: 250, name: "blue" },
	{ max: 280, name: "indigo" },
	{ max: 310, name: "purple" },
	{ max: 330, name: "fuchsia" },
	{ max: 345, name: "pink" },
	{ max: 360, name: "red" },
];

/** Derive a human color name from hue, treating low-saturation input as gray. */
export function colorNameFromHue(color: Hsl): string {
	if (color.s < 10) {
		return "gray";
	}
	const h = ((color.h % 360) + 360) % 360;
	for (const bucket of HUE_BUCKETS) {
		if (h <= bucket.max) {
			return bucket.name;
		}
	}
	return "red";
}

/**
 * Generate a full 11-stop palette from a base hex color.
 *
 * The base color is preserved verbatim at its anchor stop (no round-trip), so
 * the input hex always appears exactly in the resulting scale.
 */
export function generatePalette(baseHex: string, name?: string): Palette {
	const hex = normalizeHex(baseHex) ?? DEFAULT_HEX;
	const base = hexToHsl(hex);
	const anchorShade = nearestShade(base.l);

	const shades: Array<PaletteShade> = SHADES.map((shade) => {
		if (shade === anchorShade) {
			return {
				shade,
				hex,
				hsl: base,
				oklch: hexToOklch(hex),
				isAnchor: true,
			};
		}
		// Keep the base hue/saturation; only lightness varies per shade. (A small
		// hue/saturation drift toward the extremes could be added here later.)
		const shadeHsl: Hsl = {
			h: base.h,
			s: base.s,
			l: LIGHTNESS_TARGETS[shade],
		};
		const shadeHex = hslToHex(shadeHsl);
		return {
			shade,
			hex: shadeHex,
			hsl: shadeHsl,
			oklch: hexToOklch(shadeHex),
			isAnchor: false,
		};
	});

	return {
		name: name ?? colorNameFromHue(base),
		baseHex: hex,
		anchorShade,
		shades,
	};
}

const TEXT_DARK = "#111111";
const TEXT_LIGHT = "#ffffff";

/**
 * Pick black or white body text for legibility on a solid background — whichever
 * yields the *higher* WCAG contrast — so color-card headers and on-color samples
 * are as readable as the background allows.
 */
export function readableTextColor(hex: string): string {
	return wcagContrast(TEXT_DARK, hex) >= wcagContrast(TEXT_LIGHT, hex)
		? TEXT_DARK
		: TEXT_LIGHT;
}

/** WCAG contrast ratio (1–21) between two colors; symmetric in its arguments. */
export function contrastRatio(a: string, b: string): number {
	return wcagContrast(a, b);
}

/** WCAG grade for a contrast ratio (normal text 4.5 / 7; large text 3). */
export function contrastGrade(
	ratio: number,
): "AAA" | "AA" | "AA Large" | "Fail" {
	if (ratio >= 7) {
		return "AAA";
	}
	if (ratio >= 4.5) {
		return "AA";
	}
	if (ratio >= 3) {
		return "AA Large";
	}
	return "Fail";
}

/** Lowercase, CSS-identifier-safe version of a color name. */
export function slugify(name: string): string {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return slug.length > 0 ? slug : "color";
}

function round(value: number, places: number): number {
	const factor = 10 ** places;
	return Math.round(value * factor) / factor;
}

function formatOklch(color: Oklch): string {
	return `oklch(${round(color.l, 3)} ${round(color.c, 3)} ${round(color.h, 2)})`;
}

/** Pair each palette with a unique CSS-safe slug, disambiguating collisions. */
export function withUniqueSlugs(
	palettes: ReadonlyArray<Palette>,
): Array<{ slug: string; palette: Palette }> {
	const seen = new Map<string, number>();
	return palettes.map((palette) => {
		const base = slugify(palette.name);
		const count = seen.get(base) ?? 0;
		seen.set(base, count + 1);
		return { slug: count === 0 ? base : `${base}-${count + 1}`, palette };
	});
}

/**
 * Inline CSS custom properties for a multi-role theme wrapper: `--<slug>-<shade>`
 * for every role. Tailwind v4 cannot mint utility classes for runtime-dynamic
 * colors, so the swatches and preview read these vars instead.
 */
export function themeToCssVars(
	palettes: ReadonlyArray<Palette>,
): Record<string, string> {
	const vars: Record<string, string> = {};
	for (const { slug, palette } of withUniqueSlugs(palettes)) {
		for (const shade of palette.shades) {
			vars[`--${slug}-${shade.shade}`] = shade.hex;
		}
	}
	return vars;
}

/** Positional semantic roles the preview templates read from. */
const PREVIEW_ALIASES: ReadonlyArray<string> = [
	"primary",
	"secondary",
	"tertiary",
	"neutral",
	"accent",
];

/**
 * CSS variables for the preview surface. In addition to the name-based slugs
 * (`--<slug>-<shade>`), this aliases each role to a positional semantic name
 * (`--primary/--secondary/--tertiary/--neutral/--accent`) so templates that
 * reference `var(--secondary-600)` apply the 2nd role regardless of how it was
 * named (e.g. an imported "Color 2"). Without this, renamed roles never resolve
 * and the preview falls back to primary everywhere.
 */
export function previewThemeVars(
	palettes: ReadonlyArray<Palette>,
): Record<string, string> {
	const vars = themeToCssVars(palettes);
	palettes.forEach((palette, index) => {
		const alias = PREVIEW_ALIASES[index];
		if (!alias) {
			return;
		}
		for (const shade of palette.shades) {
			vars[`--${alias}-${shade.shade}`] = shade.hex;
		}
	});
	return vars;
}

export function toTailwindV3(palettes: ReadonlyArray<Palette>): string {
	const blocks = withUniqueSlugs(palettes)
		.map(({ slug, palette }) => {
			const entries = palette.shades
				.map((shade) => `          "${shade.shade}": "${shade.hex}",`)
				.join("\n");
			return [`        "${slug}": {`, entries, "        },"].join("\n");
		})
		.join("\n");
	return [
		"// tailwind.config.js",
		"module.exports = {",
		"  theme: {",
		"    extend: {",
		"      colors: {",
		blocks,
		"      },",
		"    },",
		"  },",
		"};",
	].join("\n");
}

export function toTailwindV4Oklch(palettes: ReadonlyArray<Palette>): string {
	const lines = withUniqueSlugs(palettes)
		.flatMap(({ slug, palette }) =>
			palette.shades.map(
				(shade) =>
					`  --color-${slug}-${shade.shade}: ${formatOklch(shade.oklch)};`,
			),
		)
		.join("\n");
	return ["@theme {", lines, "}"].join("\n");
}

export function toCssVars(palettes: ReadonlyArray<Palette>): string {
	const lines = withUniqueSlugs(palettes)
		.flatMap(({ slug, palette }) =>
			palette.shades.map(
				(shade) => `  --${slug}-${shade.shade}: ${shade.hex};`,
			),
		)
		.join("\n");
	return [":root {", lines, "}"].join("\n");
}

export function toHexList(palettes: ReadonlyArray<Palette>): string {
	return withUniqueSlugs(palettes)
		.map(({ slug, palette }) => {
			const lines = palette.shades
				.map((shade) => `${shade.shade} ${shade.hex}`)
				.join("\n");
			return `${slug}\n${lines}`;
		})
		.join("\n\n");
}

/** A DTCG 2025.10 color value: sRGB components (0–1) plus a 6-digit hex fallback. */
export function toDtcgColor(hex: string): {
	colorSpace: "srgb";
	components: [number, number, number];
	hex: string;
} {
	const c = rgb(hex);
	const components: [number, number, number] = c
		? [round(c.r, 4), round(c.g, 4), round(c.b, 4)]
		: [0, 0, 0];
	return { colorSpace: "srgb", components, hex };
}

/**
 * Serialize the theme as a W3C Design Tokens (DTCG) document conforming to the
 * stable 2025.10 spec: one group per role slug, one color token per shade where
 * `$value` is an object `{ colorSpace, components, hex }`. This is what Figma's
 * variable importers and Tokens Studio's DTCG mode expect; earlier drafts used a
 * bare hex string, which current importers reject.
 *
 * When `typography` is provided, its `fontFamily`/`fontSize`/`fontWeight`/
 * `lineHeight` groups are merged alongside the color groups in the same document.
 */
export function toFigmaTokens(
	palettes: ReadonlyArray<Palette>,
	typography?: Typography,
): string {
	const doc: Record<string, Record<string, unknown>> = {};
	for (const { slug, palette } of withUniqueSlugs(palettes)) {
		const group: Record<string, unknown> = {};
		for (const shade of palette.shades) {
			group[`${shade.shade}`] = {
				$type: "color",
				$value: toDtcgColor(shade.hex),
			};
		}
		doc[slug] = group;
	}
	if (typography) {
		Object.assign(doc, typographyToFigmaGroups(typography));
	}
	return JSON.stringify(doc, null, 2);
}
