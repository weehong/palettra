import { describe, expect, it } from "vitest";

import { hexToHsl } from "@/lib/color";
import type { Theme } from "@/lib/theme";
import {
	ROLE_PRESETS,
	buildThemeHref,
	createPresetRole,
	createPrimaryRole,
	decodeRoles,
	deriveHarmonyHex,
	effectiveHex,
	encodeRoles,
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
