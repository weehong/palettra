import type { Hsl, Shade } from "@/lib/color";
import {
	DEFAULT_HEX,
	hexToHsl,
	hslToHex,
	normalizeHex,
	slugify,
} from "@/lib/color";
import type { Typography } from "@/lib/typography";
import { encodeTypography, isDefaultTypography } from "@/lib/typography";

/**
 * Multi-role theme model.
 *
 * A theme is an ordered list of color roles. The first role is always the
 * Primary. Secondary/Tertiary/etc. can be derived from the Primary via
 * Material-style color harmony (anchor to the primary hue, rotate it, and scale
 * saturation per role) or set to a fixed color.
 */

export type PresetKey =
	"secondary" | "tertiary" | "neutral" | "success" | "warning" | "error";

export type ColorRole = {
	id: string;
	name: string;
	hex: string;
	/** When true the hex is derived from the Primary via {@link ROLE_PRESETS}. */
	auto: boolean;
	/** When true, palette randomization leaves this role unchanged. */
	locked?: boolean;
	preset?: PresetKey;
	/** Optional Figma semantic alias for each generated shade. */
	semanticNames?: Partial<Record<Shade, string>>;
};

export type Theme = {
	roles: Array<ColorRole>;
};

export type HarmonySpec = {
	/** Degrees to rotate the primary hue. */
	hueShift: number;
	/** Multiplier applied to the primary saturation. */
	satScale: number;
	/** Replace the primary hue entirely (e.g. a fixed error red). */
	fixedHue?: number;
};

export const ROLE_PRESETS: Readonly<Record<PresetKey, HarmonySpec>> = {
	secondary: { hueShift: 0, satScale: 0.45 },
	tertiary: { hueShift: 60, satScale: 0.7 },
	neutral: { hueShift: 0, satScale: 0.06 },
	success: { hueShift: 0, satScale: 1, fixedHue: 145 },
	warning: { hueShift: 0, satScale: 1, fixedHue: 45 },
	error: { hueShift: 0, satScale: 1, fixedHue: 25 },
};

export const PRESET_ORDER: ReadonlyArray<PresetKey> = [
	"secondary",
	"tertiary",
	"neutral",
	"success",
	"warning",
	"error",
];

/** The three semantic scales the "Status" menu entry adds together. */
export const STATUS_PRESETS: ReadonlyArray<PresetKey> = [
	"success",
	"warning",
	"error",
];

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** Derive a harmonized hex from a primary color using a harmony spec. */
export function deriveHarmonyHex(
	primaryHex: string,
	spec: HarmonySpec,
): string {
	const base = hexToHsl(primaryHex);
	const hue = spec.fixedHue ?? (((base.h + spec.hueShift) % 360) + 360) % 360;
	const next: Hsl = {
		h: hue,
		s: clamp(base.s * spec.satScale, 0, 100),
		l: base.l,
	};
	return hslToHex(next);
}

/** The hex a role actually renders with: derived when auto, otherwise its own. */
export function effectiveHex(role: ColorRole, primaryHex: string): string {
	if (role.auto && role.preset) {
		return deriveHarmonyHex(primaryHex, ROLE_PRESETS[role.preset]);
	}
	return role.hex;
}

function titleFromSlug(slug: string): string {
	const words = slug.split("-").filter(Boolean);
	return words
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

let roleIdCounter = 0;

function nextRoleId(prefix: string): string {
	roleIdCounter += 1;
	return `${prefix}-${roleIdCounter}`;
}

export function createPrimaryRole(hex: string): ColorRole {
	return { id: "primary", name: "Primary", hex, auto: false };
}

export function createPresetRole(
	preset: PresetKey,
	primaryHex: string,
): ColorRole {
	return {
		id: nextRoleId(preset),
		name: titleFromSlug(preset),
		hex: deriveHarmonyHex(primaryHex, ROLE_PRESETS[preset]),
		auto: true,
		preset,
	};
}

export function createCustomRole(hex: string, index: number): ColorRole {
	return {
		id: nextRoleId("custom"),
		name: `Color ${index}`,
		hex,
		auto: false,
	};
}

export function defaultTheme(primaryHex: string = DEFAULT_HEX): Theme {
	return { roles: [createPrimaryRole(primaryHex)] };
}

/**
 * Serialize the non-primary roles into a compact `colors` query value, e.g.
 * `secondary~1e88e5~a,brand~ff8800`. Slugs and hex never contain the `~`/`,`
 * separators, so this stays human-readable and reversible.
 */
export function encodeRoles(theme: Theme): string {
	return theme.roles
		.slice(1)
		.map((role) => {
			const slug = slugify(role.name);
			const hex = role.hex.replace(/^#/, "");
			return role.auto ? `${slug}~${hex}~a` : `${slug}~${hex}`;
		})
		.join(",");
}

/** Parse the `colors` query value back into roles, skipping malformed entries. */
export function decodeRoles(
	value: string | null | undefined,
): Array<ColorRole> {
	if (!value) {
		return [];
	}
	const roles: Array<ColorRole> = [];
	value.split(",").forEach((entry, index) => {
		const [slug, hex, flag] = entry.split("~");
		const normalized = normalizeHex(hex ?? "");
		if (!slug || !normalized) {
			return;
		}
		const auto = flag === "a";
		const preset = PRESET_ORDER.find((p) => p === slug);
		roles.push({
			id: `${slug}-${index}`,
			name: titleFromSlug(slug),
			hex: normalized,
			auto: auto && Boolean(preset),
			preset,
		});
	});
	return roles;
}

/** Compact share-URL representation: role index, shade, then encoded name. */
export function encodeSemanticNames(theme: Theme): string {
	return theme.roles
		.flatMap((role, roleIndex) =>
			Object.entries(role.semanticNames ?? {}).map(
				([shade, name]) =>
					`${roleIndex}~${shade}~${encodeURIComponent(encodeURIComponent(name.trim()))}`,
			),
		)
		.join(",");
}

export function applySemanticNames(
	roles: Array<ColorRole>,
	value: string | null | undefined,
): Array<ColorRole> {
	if (!value) return roles;
	const next = roles.map((role) => ({ ...role }));
	for (const entry of value.split(",")) {
		const [indexValue, shadeValue, encodedName] = entry.split("~");
		const role = next[Number(indexValue)];
		const shade = Number(shadeValue) as Shade;
		if (
			!role ||
			!encodedName ||
			![50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].includes(shade)
		)
			continue;
		try {
			// Shared URLs double-encode semantic names so Next/browser query parsing
			// can consume one layer before this decoder runs. Decode a second layer
			// when the raw encoded value is passed directly (for example in tests or
			// other API callers), while keeping already-decoded route values working.
			const once = decodeURIComponent(encodedName);
			let decoded = once;
			try {
				decoded = decodeURIComponent(once);
			} catch {
				// A literal percent sign is valid in a name but not a URI escape.
			}
			const name = decoded.trim();
			if (name) role.semanticNames = { ...role.semanticNames, [shade]: name };
		} catch {
			// Ignore malformed URL components.
		}
	}
	return next;
}

/** Compact share-URL representation of locked role indexes. */
export function encodeLockedRoles(theme: Theme): string {
	return theme.roles
		.flatMap((role, index) => (role.locked ? [String(index)] : []))
		.join(",");
}

export function applyLockedRoles(
	roles: Array<ColorRole>,
	value: string | null | undefined,
): Array<ColorRole> {
	if (!value) return roles;
	const lockedIndexes = new Set(
		value
			.split(",")
			.map(Number)
			.filter((index) => Number.isInteger(index) && index >= 0),
	);
	return roles.map((role, index) =>
		lockedIndexes.has(index) ? { ...role, locked: true } : role,
	);
}

/**
 * Build a `/generate/<primary>` href carrying the extra roles in `?colors`, the
 * non-default typography in `?type`, and the selected preview template in
 * `?preview`. The caller passes `previewKey` only when it is not the default.
 */
export function buildThemeHref(
	theme: Theme,
	typography?: Typography,
	previewKey?: string,
): string {
	const primary = theme.roles[0]?.hex ?? DEFAULT_HEX;
	const parts: Array<string> = [];
	const encoded = encodeRoles(theme);
	if (theme.roles[0]?.name && theme.roles[0].name !== "Primary") {
		parts.push(`primaryName=${encodeURIComponent(theme.roles[0].name)}`);
	}
	if (encoded.length > 0) {
		parts.push(`colors=${encoded}`);
	}
	if (typography && !isDefaultTypography(typography)) {
		parts.push(`type=${encodeTypography(typography)}`);
	}
	const semanticNames = encodeSemanticNames(theme);
	if (semanticNames) {
		parts.push(`semantic=${semanticNames}`);
	}
	const lockedRoles = encodeLockedRoles(theme);
	if (lockedRoles) {
		parts.push(`locked=${lockedRoles}`);
	}
	if (previewKey) {
		parts.push(`preview=${previewKey}`);
	}
	const query = parts.length > 0 ? `?${parts.join("&")}` : "";
	return `/generate/${primary.replace(/^#/, "")}${query}`;
}
