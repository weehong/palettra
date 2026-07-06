import { parse, stringify } from "yaml";

import { normalizeHex } from "@/lib/color";
import { toDtcgColor } from "@/lib/color";
import type { ColorRole, PresetKey, Theme } from "@/lib/theme";
import { createPresetRole, createPrimaryRole } from "@/lib/theme";

/**
 * Google Stitch design-spec model.
 *
 * A Stitch export is a Markdown document with a YAML frontmatter block followed
 * by prose sections. The frontmatter carries a *flat* Material-Design-3 token
 * set: ~45 single-hex semantic colors (`primary`, `on-primary`, `surface`,
 * `surface-container-high`, `outline`, the `*-fixed` variants, …), a set of
 * named typography styles (`display-lg`, `headline-md`, `body-md`, …), and the
 * `rounded` (radius) and `spacing` scales. The prose describes brand
 * personality and component specs.
 *
 * This is the opposite shape from the generator's seed→scale model in
 * {@link "@/lib/color"} (one hex → an 11-stop scale). Rather than force it
 * through that model, we keep the spec as its own native object and provide
 * one-way bridges into the existing `Theme`/CSS-var/DTCG world so the generator
 * UI keeps working. Everything here is pure so it can drive the editor, the
 * round-trip, and the exports without duplication.
 *
 * Round-trip fidelity: token/size/weight values are kept as *authored strings*
 * (so `'48px'`, `'700'`, `'-0.02em'` never coerce to numbers and lose unit or
 * precision), top-level frontmatter key order and unknown keys are preserved,
 * and prose section bodies are stored verbatim. The original document is also
 * retained in {@link StitchSpec.raw}. The honest guarantee is *idempotent
 * stability*: `parseStitchSpec(serializeStitchSpec(spec))` deep-equals `spec`.
 * What is normalized: hex casing (via {@link normalizeHex}), YAML quote style,
 * and the single blank line between sections.
 */

/** A named text style. Fields are authored strings, kept verbatim. */
export type StitchTextStyle = Record<string, string>;

/** A prose section captured verbatim under its `##`-level heading. */
export type StitchProseSection = {
	heading: string;
	level: number;
	body: string;
};

export type StitchSpec = {
	colors: Record<string, string>;
	typography: Record<string, StitchTextStyle>;
	rounded: Record<string, string>;
	spacing: Record<string, string>;
	/** Top-level frontmatter keys in authored order, for faithful re-emit. */
	frontmatterKeyOrder: Array<string>;
	/** Any frontmatter keys we do not model, carried through untouched. */
	extraFrontmatter: Record<string, unknown>;
	/** Leading `# H1`, if present. */
	title?: string;
	/** Prose between the H1 (or start) and the first `##` heading. */
	preamble?: string;
	sections: Array<StitchProseSection>;
	/** The original document, enabling a byte-perfect export when unedited. */
	raw: string;
};

const MODELED_KEYS: ReadonlySet<string> = new Set([
	"colors",
	"typography",
	"rounded",
	"spacing",
]);

/**
 * Split a Markdown document into its leading `---` YAML frontmatter and the
 * remaining body. Returns `frontmatter: null` when there is no well-formed
 * fenced block at the very top.
 */
export function splitFrontmatter(markdown: string): {
	frontmatter: string | null;
	body: string;
} {
	const match =
		/^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?([\s\S]*)$/.exec(
			markdown,
		);
	if (!match) {
		return { frontmatter: null, body: markdown };
	}
	return { frontmatter: match[1], body: match[2] };
}

/** Coerce a parsed YAML mapping into a flat `Record<string, string>`. */
function toStringMap(value: unknown): Record<string, string> {
	const out: Record<string, string> = {};
	if (value && typeof value === "object" && !Array.isArray(value)) {
		for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
			out[key] = String(raw);
		}
	}
	return out;
}

/** Like {@link toStringMap}, but normalizes recognizable hex values. */
function toColorMap(value: unknown): Record<string, string> {
	const out = toStringMap(value);
	for (const [key, hex] of Object.entries(out)) {
		out[key] = normalizeHex(hex) ?? hex;
	}
	return out;
}

/** Coerce the `typography` mapping into named style objects of strings. */
function toStyleMap(value: unknown): Record<string, StitchTextStyle> {
	const out: Record<string, StitchTextStyle> = {};
	if (value && typeof value === "object" && !Array.isArray(value)) {
		for (const [name, style] of Object.entries(
			value as Record<string, unknown>,
		)) {
			out[name] = toStringMap(style);
		}
	}
	return out;
}

const HEADING_PATTERN = /^(#{2,})\s+(.*)$/;
const TITLE_PATTERN = /^#\s+(.*)$/;

/** Parse the Markdown body into an optional title/preamble and `##` sections. */
function parseBody(body: string): {
	title?: string;
	preamble?: string;
	sections: Array<StitchProseSection>;
} {
	const sections: Array<StitchProseSection> = [];
	let title: string | undefined;
	const preambleLines: Array<string> = [];
	let current: { heading: string; level: number; lines: Array<string> } | null =
		null;

	const flush = (): void => {
		if (current) {
			sections.push({
				heading: current.heading,
				level: current.level,
				body: current.lines.join("\n").trim(),
			});
		}
	};

	for (const line of body.split("\n")) {
		const heading = HEADING_PATTERN.exec(line);
		if (heading) {
			flush();
			current = { heading: heading[2].trim(), level: heading[1].length, lines: [] };
			continue;
		}
		const titleMatch = TITLE_PATTERN.exec(line);
		if (titleMatch && !current && sections.length === 0 && title === undefined) {
			title = titleMatch[1].trim();
			continue;
		}
		if (current) {
			current.lines.push(line);
		} else {
			preambleLines.push(line);
		}
	}
	flush();

	const preamble = preambleLines.join("\n").trim();
	return {
		title,
		preamble: preamble.length > 0 ? preamble : undefined,
		sections,
	};
}

/** Parse a Stitch Markdown document into a {@link StitchSpec}. */
export function parseStitchSpec(markdown: string): StitchSpec {
	const { frontmatter, body } = splitFrontmatter(markdown);
	const fm: Record<string, unknown> =
		frontmatter && typeof parse(frontmatter) === "object"
			? ((parse(frontmatter) as Record<string, unknown>) ?? {})
			: {};

	const frontmatterKeyOrder = Object.keys(fm);
	const extraFrontmatter: Record<string, unknown> = {};
	for (const key of frontmatterKeyOrder) {
		if (!MODELED_KEYS.has(key)) {
			extraFrontmatter[key] = fm[key];
		}
	}

	const { title, preamble, sections } = parseBody(body);

	return {
		colors: toColorMap(fm.colors),
		typography: toStyleMap(fm.typography),
		rounded: toStringMap(fm.rounded),
		spacing: toStringMap(fm.spacing),
		frontmatterKeyOrder,
		extraFrontmatter,
		title,
		preamble,
		sections,
		raw: markdown,
	};
}

/** Reassemble the frontmatter object in its authored key order. */
function buildFrontmatter(spec: StitchSpec): Record<string, unknown> {
	const modeled: Record<string, unknown> = {
		colors: spec.colors,
		typography: spec.typography,
		rounded: spec.rounded,
		spacing: spec.spacing,
	};
	const out: Record<string, unknown> = {};
	for (const key of spec.frontmatterKeyOrder) {
		if (MODELED_KEYS.has(key)) {
			out[key] = modeled[key];
		} else if (key in spec.extraFrontmatter) {
			out[key] = spec.extraFrontmatter[key];
		}
	}
	// Carry modeled groups that were absent from the recorded key order.
	for (const key of MODELED_KEYS) {
		const group = modeled[key] as Record<string, unknown>;
		if (!(key in out) && group && Object.keys(group).length > 0) {
			out[key] = group;
		}
	}
	return out;
}

/** Reassemble the Markdown body from the title/preamble/sections. */
function serializeBody(spec: StitchSpec): string {
	const parts: Array<string> = [];
	if (spec.title) {
		parts.push(`# ${spec.title}`);
	}
	if (spec.preamble) {
		parts.push(spec.preamble);
	}
	for (const section of spec.sections) {
		const hashes = "#".repeat(section.level);
		parts.push(
			section.body.length > 0
				? `${hashes} ${section.heading}\n\n${section.body}`
				: `${hashes} ${section.heading}`,
		);
	}
	return `${parts.join("\n\n")}\n`;
}

/**
 * Serialize a {@link StitchSpec} back to a Stitch Markdown document. Frontmatter
 * is re-emitted in authored key order; prose bodies are re-emitted verbatim.
 */
export function serializeStitchSpec(spec: StitchSpec): string {
	const frontmatter = stringify(buildFrontmatter(spec), {
		lineWidth: 0,
		singleQuote: true,
	});
	return `---\n${frontmatter}---\n\n${serializeBody(spec)}`;
}

const PRESET_TOKENS: ReadonlyArray<{ preset: PresetKey; token: string }> = [
	{ preset: "secondary", token: "secondary" },
	{ preset: "tertiary", token: "tertiary" },
	{ preset: "error", token: "error" },
	{ preset: "neutral", token: "outline" },
];

/**
 * Project the spec's anchor colors onto the generator's role model so the
 * existing swatch/preview/export pipeline keeps working. Each role is *fixed*
 * (`auto: false`) at the spec's exact hex — a lossy live-editor projection; the
 * full token set lives only on the {@link StitchSpec}.
 */
export function stitchToTheme(spec: StitchSpec): Theme {
	const primaryHex = normalizeHex(spec.colors.primary ?? "") ?? "#000000";
	const roles: Array<ColorRole> = [createPrimaryRole(primaryHex)];
	for (const { preset, token } of PRESET_TOKENS) {
		const hex = normalizeHex(spec.colors[token] ?? "");
		if (hex) {
			roles.push({ ...createPresetRole(preset, primaryHex), hex, auto: false });
		}
	}
	return { roles };
}

/** Lowercase a token/field name into a kebab-case CSS-var-safe fragment. */
function cssFragment(name: string): string {
	return name
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Inline CSS custom properties for the flat MD3 tokens, in a separate namespace
 * from the role scales (`--surface`, not `--surface-500`), plus `--radius-*`,
 * `--spacing-*`, and `--type-*` so previews can read them directly.
 */
export function stitchToCssVars(spec: StitchSpec): Record<string, string> {
	const vars: Record<string, string> = {};
	for (const [token, hex] of Object.entries(spec.colors)) {
		vars[`--${cssFragment(token)}`] = hex;
	}
	for (const [name, value] of Object.entries(spec.rounded)) {
		vars[name === "DEFAULT" ? "--radius" : `--radius-${cssFragment(name)}`] =
			value;
	}
	for (const [name, value] of Object.entries(spec.spacing)) {
		vars[`--spacing-${cssFragment(name)}`] = value;
	}
	for (const [style, fields] of Object.entries(spec.typography)) {
		for (const [field, value] of Object.entries(fields)) {
			vars[`--type-${cssFragment(style)}-${cssFragment(field)}`] = value;
		}
	}
	return vars;
}

type DimensionToken = {
	$type: "dimension";
	$value: { value: number; unit: "px" | "rem" };
};

/** Parse `"0.5rem"` / `"9999px"` into a DTCG dimension token, or null. */
function toDimensionToken(value: string): DimensionToken | null {
	const match = /^(-?[0-9]*\.?[0-9]+)(px|rem)$/.exec(value.trim());
	if (!match) {
		return null;
	}
	return {
		$type: "dimension",
		$value: { value: Number(match[1]), unit: match[2] as "px" | "rem" },
	};
}

/** A dimension group, skipping values that are not px/rem. */
function dimensionGroup(
	source: Record<string, string>,
): Record<string, DimensionToken> {
	const group: Record<string, DimensionToken> = {};
	for (const [name, value] of Object.entries(source)) {
		const token = toDimensionToken(value);
		if (token) {
			group[name] = token;
		}
	}
	return group;
}

/** One DTCG composite `typography` token per named style. */
function typographyGroup(
	styles: Record<string, StitchTextStyle>,
): Record<string, unknown> {
	const group: Record<string, unknown> = {};
	for (const [name, fields] of Object.entries(styles)) {
		const value: Record<string, unknown> = {};
		if (fields.fontFamily) {
			value.fontFamily = fields.fontFamily;
		}
		const size = fields.fontSize ? toDimensionToken(fields.fontSize) : null;
		if (size) {
			value.fontSize = size.$value;
		} else if (fields.fontSize) {
			value.fontSize = fields.fontSize;
		}
		if (fields.fontWeight && /^[0-9]+$/.test(fields.fontWeight)) {
			value.fontWeight = Number(fields.fontWeight);
		} else if (fields.fontWeight) {
			value.fontWeight = fields.fontWeight;
		}
		if (fields.lineHeight && /^[0-9]*\.?[0-9]+$/.test(fields.lineHeight)) {
			value.lineHeight = Number(fields.lineHeight);
		} else if (fields.lineHeight) {
			value.lineHeight = fields.lineHeight;
		}
		if (fields.letterSpacing) {
			value.letterSpacing = fields.letterSpacing;
		}
		group[name] = { $type: "typography", $value: value };
	}
	return group;
}

/**
 * Serialize the spec as a W3C Design Tokens (DTCG 2025.10) document: a `color`
 * group (reusing {@link toDtcgColor} for the sRGB-components+hex shape used
 * elsewhere in the app), `radius`/`spacing` dimension groups, and a `typography`
 * group of composite tokens.
 */
export function stitchToDtcg(spec: StitchSpec): string {
	const color: Record<string, unknown> = {};
	for (const [token, hex] of Object.entries(spec.colors)) {
		color[token] = { $type: "color", $value: toDtcgColor(hex) };
	}
	return JSON.stringify(
		{
			color,
			radius: dimensionGroup(spec.rounded),
			spacing: dimensionGroup(spec.spacing),
			typography: typographyGroup(spec.typography),
		},
		null,
		2,
	);
}
