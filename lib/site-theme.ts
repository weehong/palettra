import type { Palette } from "@/lib/color";
import {
	SHADES,
	contrastRatio,
	hexToHsl,
	hslToHex,
	readableTextColor,
	type Shade,
} from "@/lib/color";
import { fontStack } from "@/lib/fonts";
import type { ColorRole, PresetKey } from "@/lib/theme";
import type { Typography } from "@/lib/typography";

/**
 * Flat CSS custom properties that can override the app chrome theme.
 */
export type SiteThemeVars = Record<string, string>;

type Scheme = "light" | "dark";
type Scale = Readonly<Record<Shade, string>>;
type RoleScale = {
	index: number;
	role: ColorRole;
	scale: Scale;
	hue: number;
	saturation: number;
};

const MIN_CONTRAST = 4.5;
const SHADE_FALLBACK: Shade = 500;
const TEXT_BLACK = "#000000";
const TEXT_WHITE = "#ffffff";

function shade(scale: Scale, value: Shade): string {
	return scale[value] ?? scale[SHADE_FALLBACK];
}

function paletteScale(palette: Palette): Scale {
	const entries = palette.shades.map((entry) => [entry.shade, entry.hex]);
	return Object.fromEntries(entries) as Record<Shade, string>;
}

function neutralScaleFromPrimary(primary: Palette): Scale {
	const entries = primary.shades.map((entry) => [
		entry.shade,
		hslToHex({ ...entry.hsl, s: Math.min(entry.hsl.s * 0.06, 6) }),
	]);
	return Object.fromEntries(entries) as Record<Shade, string>;
}

function normalized(value: string): string {
	return value.trim().toLowerCase();
}

function roleMatches(
	role: ColorRole,
	target: PresetKey | "primary" | "accent",
): boolean {
	const key = normalized(target);
	return (
		role.preset === target ||
		normalized(role.id) === key ||
		normalized(role.name) === key
	);
}

function roleScales(
	roles: ReadonlyArray<ColorRole>,
	palettes: ReadonlyArray<Palette>,
): Array<RoleScale> {
	return roles.flatMap((role, index) => {
		const palette = palettes[index];
		if (!palette) {
			return [];
		}
		const hsl = hexToHsl(palette.baseHex);
		return [
			{
				index,
				role,
				scale: paletteScale(palette),
				hue: ((hsl.h % 360) + 360) % 360,
				saturation: hsl.s,
			},
		];
	});
}

function includesAny(value: string, parts: ReadonlyArray<string>): boolean {
	const normalizedValue = normalized(value);
	return parts.some((part) => normalizedValue.includes(part));
}

function isNeutralCandidate(entry: RoleScale): boolean {
	return (
		entry.saturation <= 35 ||
		includesAny(entry.role.id, [
			"neutral",
			"gray",
			"grey",
			"slate",
			"zinc",
			"stone",
			"bunker",
			"charcoal",
		]) ||
		includesAny(entry.role.name, [
			"neutral",
			"gray",
			"grey",
			"slate",
			"zinc",
			"stone",
			"bunker",
			"charcoal",
		])
	);
}

function hueBetween(hue: number, min: number, max: number): boolean {
	return hue >= min && hue <= max;
}

function accessibleShade(
	scale: Scale,
	background: string,
	candidates: ReadonlyArray<Shade>,
): string {
	for (const candidate of candidates) {
		const color = shade(scale, candidate);
		if (contrastRatio(color, background) >= MIN_CONTRAST) {
			return color;
		}
	}
	return foregroundFor(background);
}

function foregroundFor(background: string): string {
	const preferred = readableTextColor(background);
	if (contrastRatio(preferred, background) >= MIN_CONTRAST) {
		return preferred;
	}
	return contrastRatio(TEXT_BLACK, background) >=
		contrastRatio(TEXT_WHITE, background)
		? TEXT_BLACK
		: TEXT_WHITE;
}

/**
 * Map generated palette roles and typography onto the app's flat chrome tokens.
 *
 * Role identity comes from {@link ColorRole}; generated palettes only provide
 * index-aligned shade data.
 */
export function siteThemeVars(input: {
	roles: ReadonlyArray<ColorRole>;
	palettes: ReadonlyArray<Palette>;
	typography: Typography;
	scheme: Scheme;
}): SiteThemeVars {
	const entries = roleScales(input.roles, input.palettes);
	const primary = entries[0]
		? entries[0].scale
		: (Object.fromEntries(SHADES.map((entry) => [entry, "#000000"])) as Record<
				Shade,
				string
			>);
	const used = new Set<number>([0]);

	function pickExplicit(matches: (role: ColorRole) => boolean): RoleScale | null {
		const entry = entries.find(({ role }) => matches(role));
		if (entry) {
			used.add(entry.index);
		}
		return entry ?? null;
	}

	function pickUnused(matches: (entry: RoleScale) => boolean): RoleScale | null {
		const entry = entries.find(
			(candidate) => !used.has(candidate.index) && matches(candidate),
		);
		if (entry) {
			used.add(entry.index);
		}
		return entry ?? null;
	}

	function pickNeutral(): RoleScale | null {
		const candidates = entries
			.filter((entry) => !used.has(entry.index) && isNeutralCandidate(entry))
			.sort((a, b) => a.saturation - b.saturation);
		const entry = candidates[0] ?? null;
		if (entry) {
			used.add(entry.index);
		}
		return entry;
	}

	const neutralEntry =
		pickExplicit((role) => roleMatches(role, "neutral")) ?? pickNeutral();
	const secondaryEntry = pickExplicit((role) => roleMatches(role, "secondary"));
	const accentEntry =
		pickExplicit((role) => roleMatches(role, "tertiary")) ??
		pickExplicit((role) => roleMatches(role, "accent"));
	const successEntry = pickExplicit((role) => roleMatches(role, "success"));
	const warningEntry = pickExplicit((role) => roleMatches(role, "warning"));
	const destructiveEntry = pickExplicit((role) => roleMatches(role, "error"));

	const secondary = (secondaryEntry ?? pickUnused(() => true))?.scale ?? primary;
	const accent = (accentEntry ?? pickUnused(() => true))?.scale ?? secondary;
	const success =
		successEntry?.scale ??
		pickUnused(
			(entry) =>
				hueBetween(entry.hue, 80, 170) ||
				includesAny(entry.role.name, ["green", "emerald", "lime", "success"]),
		)?.scale ??
		pickUnused(() => true)?.scale;
	const warning =
		warningEntry?.scale ??
		pickUnused(
			(entry) =>
				hueBetween(entry.hue, 20, 75) ||
				includesAny(entry.role.name, [
					"yellow",
					"amber",
					"orange",
					"warning",
				]),
		)?.scale ??
		pickUnused(() => true)?.scale;
	const destructive =
		destructiveEntry?.scale ??
		pickUnused(
			(entry) =>
				entry.hue <= 18 ||
				entry.hue >= 340 ||
				includesAny(entry.role.name, [
					"red",
					"rose",
					"destructive",
					"error",
				]),
		)?.scale ??
		pickUnused(() => true)?.scale;
	const neutral =
		neutralEntry?.scale ??
		(input.palettes[0] ? neutralScaleFromPrimary(input.palettes[0]) : primary);

	const isDark = input.scheme === "dark";
	const background = isDark ? shade(neutral, 950) : shade(neutral, 50);
	const card = isDark ? shade(neutral, 900) : "#ffffff";
	const foreground = isDark ? shade(neutral, 50) : shade(neutral, 950);
	const popover = isDark ? shade(neutral, 800) : shade(neutral, 50);
	const primaryFill = isDark ? shade(primary, 500) : shade(primary, 600);
	const secondaryFill = isDark ? shade(secondary, 500) : shade(secondary, 600);
	const accentFill = isDark ? shade(accent, 500) : shade(accent, 600);
	const accentSubtle = isDark ? shade(accent, 900) : shade(accent, 100);
	const vars: SiteThemeVars = {
		"--background": background,
		"--foreground": foreground,
		"--card": card,
		"--card-foreground": foreground,
		"--popover": popover,
		"--popover-foreground": foreground,
		"--muted": isDark ? shade(neutral, 800) : shade(neutral, 100),
		"--muted-foreground": accessibleShade(
			neutral,
			card,
			isDark ? [500, 400, 300, 200, 100, 50] : [500, 600, 700, 800, 900, 950],
		),
		"--border": isDark ? shade(neutral, 800) : shade(neutral, 200),
		"--input": isDark ? shade(neutral, 700) : shade(neutral, 300),
		"--primary": primaryFill,
		"--primary-foreground": foregroundFor(primaryFill),
		"--primary-hover": isDark ? shade(primary, 400) : shade(primary, 700),
		"--secondary": secondaryFill,
		"--secondary-foreground": foregroundFor(secondaryFill),
		"--accent": accentFill,
		"--accent-foreground": foregroundFor(accentFill),
		"--accent-subtle": accentSubtle,
		"--accent-subtle-foreground": accessibleShade(
			accent,
			accentSubtle,
			isDark ? [100, 50, 200, 300, 400, 500] : [900, 950, 800, 700, 600, 500],
		),
		"--ring": isDark ? shade(primary, 400) : shade(primary, 500),
		"--overlay": shade(neutral, 950),
		"--font-sans": fontStack(input.typography.fonts.sans),
		"--font-mono": fontStack(input.typography.fonts.mono),
	};

	if (destructive) {
		const destructiveFill = isDark
			? shade(destructive, 500)
			: shade(destructive, 600);
		vars["--destructive"] = destructiveFill;
		vars["--destructive-foreground"] = foregroundFor(destructiveFill);
	}
	if (success) {
		const successFill = isDark ? shade(success, 500) : shade(success, 600);
		vars["--success"] = successFill;
		vars["--success-foreground"] = foregroundFor(successFill);
	}
	if (warning) {
		const warningFill = isDark ? shade(warning, 500) : shade(warning, 600);
		vars["--warning"] = warningFill;
		vars["--warning-foreground"] = foregroundFor(warningFill);
	}

	return vars;
}
