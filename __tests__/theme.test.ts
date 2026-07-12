import { describe, expect, it } from "vitest";

import { hexToHsl } from "@/lib/color";
import type { Theme } from "@/lib/theme";
import {
	applyLockedRoles,
	applySemanticNames,
	ROLE_PRESETS,
	buildThemeHref,
	createPresetRole,
	createPrimaryRole,
	decodeRoles,
	deriveHarmonyHex,
	effectiveHex,
	encodeRoles,
	encodeLockedRoles,
	encodeSemanticNames,
} from "@/lib/theme";
import { defaultTypography } from "@/lib/typography";

const PRIMARY = "#a543bc";

describe("deriveHarmonyHex", () => {
	it("keeps hue but lowers saturation for secondary", () => {
		const base = hexToHsl(PRIMARY);
		const secondary = hexToHsl(
			deriveHarmonyHex(PRIMARY, ROLE_PRESETS.secondary),
		);
		expect(Math.abs(secondary.h - base.h)).toBeLessThan(2);
		expect(secondary.s).toBeLessThan(base.s);
	});

	it("rotates hue ~60° for tertiary", () => {
		const base = hexToHsl(PRIMARY);
		const tertiary = hexToHsl(deriveHarmonyHex(PRIMARY, ROLE_PRESETS.tertiary));
		const delta = (tertiary.h - base.h + 360) % 360;
		expect(delta).toBeGreaterThan(55);
		expect(delta).toBeLessThan(65);
	});

	it("produces a near-gray neutral", () => {
		const neutral = hexToHsl(deriveHarmonyHex(PRIMARY, ROLE_PRESETS.neutral));
		expect(neutral.s).toBeLessThan(10);
	});

	it("derives a green success scale regardless of the primary hue", () => {
		const success = hexToHsl(deriveHarmonyHex(PRIMARY, ROLE_PRESETS.success));
		expect(success.h).toBeGreaterThan(140);
		expect(success.h).toBeLessThan(150);
	});

	it("derives an amber warning scale regardless of the primary hue", () => {
		const warning = hexToHsl(deriveHarmonyHex(PRIMARY, ROLE_PRESETS.warning));
		expect(warning.h).toBeGreaterThan(40);
		expect(warning.h).toBeLessThan(50);
	});
});

describe("effectiveHex", () => {
	it("derives auto roles from the primary and respects fixed roles", () => {
		const auto = createPresetRole("secondary", PRIMARY);
		expect(effectiveHex(auto, PRIMARY)).toBe(
			deriveHarmonyHex(PRIMARY, ROLE_PRESETS.secondary),
		);

		const fixed = { ...auto, auto: false, hex: "#123456" };
		expect(effectiveHex(fixed, PRIMARY)).toBe("#123456");
	});
});

describe("encode/decode roles", () => {
	it("round-trips extra roles through the URL value", () => {
		const theme: Theme = {
			roles: [
				createPrimaryRole(PRIMARY),
				createPresetRole("secondary", PRIMARY),
				{ id: "x", name: "Brand", hex: "#ff8800", auto: false },
			],
		};
		const encoded = encodeRoles(theme);
		expect(encoded).toContain("secondary~");
		expect(encoded).toContain("brand~ff8800");

		const decoded = decodeRoles(encoded);
		expect(decoded).toHaveLength(2);
		expect(decoded[0].preset).toBe("secondary");
		expect(decoded[0].auto).toBe(true);
		expect(decoded[1].hex).toBe("#ff8800");
		expect(decoded[1].auto).toBe(false);
	});

	it("ignores malformed entries", () => {
		expect(decodeRoles("garbage,nope~zzz")).toHaveLength(0);
		expect(decodeRoles("")).toHaveLength(0);
	});

	it("recognizes status roles as auto presets", () => {
		const decoded = decodeRoles("success~16a34a~a,warning~d97706~a");
		expect(decoded).toHaveLength(2);
		expect(decoded[0].preset).toBe("success");
		expect(decoded[0].auto).toBe(true);
		expect(decoded[1].preset).toBe("warning");
		expect(decoded[1].auto).toBe(true);
	});
});

describe("buildThemeHref", () => {
	const theme: Theme = { roles: [createPrimaryRole(PRIMARY)] };

	it("omits query params for a bare default theme", () => {
		expect(buildThemeHref(theme)).toBe("/generate/a543bc");
	});

	it("appends preview only when a key is passed", () => {
		expect(buildThemeHref(theme, undefined, "charts")).toBe(
			"/generate/a543bc?preview=charts",
		);
		expect(buildThemeHref(theme, undefined, undefined)).toBe(
			"/generate/a543bc",
		);
	});

	it("composes colors, type, and preview together", () => {
		const withRoles: Theme = {
			roles: [
				createPrimaryRole(PRIMARY),
				{ id: "x", name: "Brand", hex: "#ff8800", auto: false },
			],
		};
		const typography = { ...defaultTypography(), baseSize: 18 };
		const href = buildThemeHref(withRoles, typography, "dashboard");
		expect(href).toContain("colors=brand~ff8800");
		expect(href).toContain("type=");
		expect(href).toContain("preview=dashboard");
	});
});

describe("locked role URLs", () => {
	it("round-trips locked primary and extra roles", () => {
		const theme: Theme = {
			roles: [
				{ ...createPrimaryRole(PRIMARY), locked: true },
				{ id: "x", name: "Brand", hex: "#ff8800", auto: false },
				{
					id: "y",
					name: "Accent",
					hex: "#0088ff",
					auto: false,
					locked: true,
				},
			],
		};

		expect(encodeLockedRoles(theme)).toBe("0,2");
		expect(buildThemeHref(theme)).toContain("locked=0,2");
		const restored = applyLockedRoles(
			theme.roles.map(({ locked, ...role }) => role),
			"0,2",
		);
		expect(restored.map((role) => role.locked ?? false)).toEqual([
			true,
			false,
			true,
		]);
	});

	it("ignores malformed and out-of-range lock indexes", () => {
		const roles = [createPrimaryRole(PRIMARY)];
		expect(applyLockedRoles(roles, "nope,-1,4")).toEqual(roles);
	});
});

describe("semantic name URLs", () => {
	it("round-trips semantic names and lock state through a theme href", () => {
		const role = createPrimaryRole(PRIMARY);
		role.semanticNames = { 200: "surface muted", 900: "text-strong" };
		const theme: Theme = { roles: [role], semanticNamesLocked: true };

		expect(encodeSemanticNames(theme)).toBe(
			"0~200~surface%2520muted,0~900~text-strong",
		);
		expect(buildThemeHref(theme)).toContain("semanticLocked=1");
		const restored = applySemanticNames(
			[createPrimaryRole(PRIMARY)],
			encodeSemanticNames(theme),
		);
		expect(restored[0].semanticNames).toEqual(role.semanticNames);
	});

	it("preserves a custom primary ramp name", () => {
		const role = createPrimaryRole(PRIMARY);
		role.name = "Brand Gray";
		expect(buildThemeHref({ roles: [role] })).toContain(
			"primaryName=Brand%20Gray",
		);
	});
});
