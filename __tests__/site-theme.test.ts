import { describe, expect, it } from "vitest";

import { contrastRatio, generatePalette, hexToHsl } from "@/lib/color";
import type { Palette } from "@/lib/color";
import type { ColorRole } from "@/lib/theme";
import { createPresetRole, createPrimaryRole, effectiveHex } from "@/lib/theme";
import { fontStack } from "@/lib/fonts";
import { siteThemeVars } from "@/lib/site-theme";
import type { Typography } from "@/lib/typography";
import { defaultTypography } from "@/lib/typography";

const REQUIRED_KEYS = [
	"--background",
	"--foreground",
	"--card",
	"--card-foreground",
	"--popover",
	"--popover-foreground",
	"--muted",
	"--muted-foreground",
	"--border",
	"--input",
	"--primary",
	"--primary-foreground",
	"--primary-hover",
	"--secondary",
	"--secondary-foreground",
	"--accent",
	"--accent-foreground",
	"--accent-subtle",
	"--accent-subtle-foreground",
	"--ring",
	"--overlay",
	"--font-sans",
	"--font-mono",
] as const;

function effectiveRoles(roles: ReadonlyArray<ColorRole>): Array<ColorRole> {
	const primaryHex = roles[0]?.hex ?? "#000000";
	return roles.map((role) => ({
		...role,
		hex: effectiveHex(role, primaryHex),
	}));
}

function buildTheme(roles: ReadonlyArray<ColorRole>): {
	roles: Array<ColorRole>;
	palettes: Array<Palette>;
} {
	const resolved = effectiveRoles(roles);
	return {
		roles: resolved,
		palettes: resolved.map((role) => generatePalette(role.hex, role.name)),
	};
}

function shade(palette: Palette, shadeValue: number): string {
	const color = palette.shades.find((entry) => entry.shade === shadeValue);
	if (!color) {
		throw new Error(`Missing shade ${shadeValue}.`);
	}
	return color.hex;
}

function fullRoles(): Array<ColorRole> {
	const primary = createPrimaryRole("#2563eb");
	return [
		primary,
		createPresetRole("secondary", primary.hex),
		createPresetRole("tertiary", primary.hex),
		createPresetRole("neutral", primary.hex),
		createPresetRole("success", primary.hex),
		createPresetRole("warning", primary.hex),
		createPresetRole("error", primary.hex),
	];
}

function varsFor(
	scheme: "light" | "dark",
	roles: ReadonlyArray<ColorRole> = fullRoles(),
	typography: Typography = defaultTypography(),
) {
	const theme = buildTheme(roles);
	return siteThemeVars({ ...theme, typography, scheme });
}

describe("siteThemeVars", () => {
	it("emits the complete flat token set for both schemes", () => {
		const light = varsFor("light");
		const dark = varsFor("dark");

		for (const key of REQUIRED_KEYS) {
			expect(light).toHaveProperty(key);
			expect(dark).toHaveProperty(key);
		}
		expect(light).toHaveProperty("--destructive");
		expect(light).toHaveProperty("--destructive-foreground");
		expect(light).toHaveProperty("--success");
		expect(light).toHaveProperty("--success-foreground");
		expect(light).toHaveProperty("--warning");
		expect(light).toHaveProperty("--warning-foreground");
		expect(dark).toHaveProperty("--destructive");
		expect(dark).toHaveProperty("--destructive-foreground");
		expect(dark).toHaveProperty("--success");
		expect(dark).toHaveProperty("--success-foreground");
		expect(dark).toHaveProperty("--warning");
		expect(dark).toHaveProperty("--warning-foreground");
	});

	it("selects accessible surface text, muted text, and opaque overlays", () => {
		for (const scheme of ["light", "dark"] as const) {
			const vars = varsFor(scheme);
			expect(
				contrastRatio(vars["--foreground"], vars["--background"]),
			).toBeGreaterThanOrEqual(4.5);
			expect(
				contrastRatio(vars["--muted-foreground"], vars["--card"]),
			).toBeGreaterThanOrEqual(4.5);
			expect(vars["--overlay"]).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it("contrast-picks foregrounds for colored and subtle fills", () => {
		for (const scheme of ["light", "dark"] as const) {
			const vars = varsFor(scheme);
			const pairs = [
				["--primary-foreground", "--primary"],
				["--secondary-foreground", "--secondary"],
				["--accent-foreground", "--accent"],
				["--accent-subtle-foreground", "--accent-subtle"],
				["--destructive-foreground", "--destructive"],
				["--success-foreground", "--success"],
				["--warning-foreground", "--warning"],
			] as const;

			for (const [foreground, background] of pairs) {
				expect(
					contrastRatio(vars[foreground], vars[background]),
				).toBeGreaterThanOrEqual(4.5);
			}
		}
	});

	it("keeps dark primary hover lighter than dark primary", () => {
		const vars = varsFor("dark");

		expect(hexToHsl(vars["--primary-hover"]).l).toBeGreaterThan(
			hexToHsl(vars["--primary"]).l,
		);
	});

	it("falls back without neutral or status roles", () => {
		const primary = createPrimaryRole("#a543bc");
		const vars = varsFor("light", [primary]);

		expect(vars["--background"]).toMatch(/^#[0-9a-f]{6}$/);
		expect(hexToHsl(vars["--background"]).s).toBeLessThan(10);
		expect(vars).not.toHaveProperty("--destructive");
		expect(vars).not.toHaveProperty("--destructive-foreground");
		expect(vars).not.toHaveProperty("--success");
		expect(vars).not.toHaveProperty("--success-foreground");
		expect(vars).not.toHaveProperty("--warning");
		expect(vars).not.toHaveProperty("--warning-foreground");
	});

	it("maps custom palette colors into available site theme slots", () => {
		const roles: Array<ColorRole> = [
			createPrimaryRole("#e63946"),
			{
				id: "powder-blue",
				name: "Powder Blue",
				hex: "#3e949c",
				auto: false,
			},
			{ id: "cello", name: "Cello", hex: "#3777c0", auto: false },
			{ id: "emerald", name: "Emerald", hex: "#32cd65", auto: false },
			{
				id: "international-orange",
				name: "International Orange",
				hex: "#f67219",
				auto: false,
			},
			{ id: "red", name: "Red", hex: "#ff3628", auto: false },
			{ id: "bunker", name: "Bunker", hex: "#5d799a", auto: false },
		];
		const theme = buildTheme(roles);
		const vars = siteThemeVars({
			...theme,
			typography: defaultTypography(),
			scheme: "light",
		});

		expect(vars["--secondary"]).toBe(shade(theme.palettes[1], 600));
		expect(vars["--accent"]).toBe(shade(theme.palettes[2], 600));
		expect(vars["--success"]).toBe(shade(theme.palettes[3], 600));
		expect(vars["--warning"]).toBe(shade(theme.palettes[4], 600));
		expect(vars["--destructive"]).toBe(shade(theme.palettes[5], 600));
		expect(vars["--background"]).toBe(shade(theme.palettes[6], 50));
		expect(vars["--border"]).toBe(shade(theme.palettes[6], 200));
	});

	it("resolves accent from tertiary before an accent-named custom role", () => {
		const primary = createPrimaryRole("#2563eb");
		const tertiary = createPresetRole("tertiary", primary.hex);
		const accentNamed: ColorRole = {
			id: "accent",
			name: "Accent",
			hex: "#ff8800",
			auto: false,
		};
		const theme = buildTheme([primary, tertiary, accentNamed]);
		const vars = siteThemeVars({
			...theme,
			typography: defaultTypography(),
			scheme: "light",
		});

		expect(vars["--accent"]).toBe(shade(theme.palettes[1], 600));
	});

	it("uses exported font stacks for sans and mono typography", () => {
		const typography = {
			...defaultTypography(),
			fonts: {
				...defaultTypography().fonts,
				sans: "Poppins",
				mono: "Fira Code",
			},
		};
		const vars = varsFor("light", fullRoles(), typography);

		expect(vars["--font-sans"]).toBe(fontStack("Poppins"));
		expect(vars["--font-mono"]).toBe(fontStack("Fira Code"));
	});
});
