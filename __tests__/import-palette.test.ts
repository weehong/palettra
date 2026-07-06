import { describe, expect, it } from "vitest";

import {
	extractHexes,
	PALETTE_JSON_TEMPLATE,
	parseJsonPalette,
	parsePaletteInput,
} from "@/lib/import-palette";

describe("PALETTE_JSON_TEMPLATE", () => {
	it("parses back into named colors, seeding shade groups from 500", () => {
		const colors = parsePaletteInput(PALETTE_JSON_TEMPLATE);
		expect(colors).toEqual([
			{ name: "Primary", hex: "#a543bc" },
			{ name: "Secondary", hex: "#1e88e5" },
			{ name: "Accent", hex: "#7c3aed" },
		]);
	});
});

describe("extractHexes", () => {
	it("parses a coolors.co share URL", () => {
		expect(
			extractHexes(
				"https://coolors.co/264653-2a9d8f-e9c46a-f4a261-e76f51",
			),
		).toEqual(["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"]);
	});

	it("parses the /palette/ URL variant", () => {
		expect(
			extractHexes("https://coolors.co/palette/ff0000-00ff00"),
		).toEqual(["#ff0000", "#00ff00"]);
	});

	it("parses a comma/space/newline hex list with or without #", () => {
		expect(extractHexes("#a543bc, 1e88e5\n#abc")).toEqual([
			"#a543bc",
			"#1e88e5",
			"#aabbcc",
		]);
	});

	it("ignores non-color noise and dedupes preserving order", () => {
		expect(extractHexes("colors: #a543bc and again a543bc; zzz")).toEqual([
			"#a543bc",
		]);
	});

	it("returns an empty array when there is nothing valid", () => {
		expect(extractHexes("")).toEqual([]);
		expect(extractHexes("no colors here")).toEqual([]);
	});
});

describe("parseJsonPalette", () => {
	it("parses a uicolors.app Figma tokens export, seeding from the 500 shade", () => {
		const input = JSON.stringify({
			"red-ribbon": {
				"50": { value: "#fef2f3", type: "color" },
				"500": { value: "#e63946", type: "color" },
				"950": { value: "#430c10", type: "color" },
			},
			"powder-blue": {
				"200": { value: "#a8dadc", type: "color" },
				"500": { value: "#3e949c", type: "color" },
			},
		});
		expect(parseJsonPalette(input)).toEqual([
			{ name: "Red Ribbon", hex: "#e63946" },
			{ name: "Powder Blue", hex: "#3e949c" },
		]);
	});

	it("parses the uicolors.app Tailwind HEX export (bare string shades)", () => {
		const input = JSON.stringify({
			cello: { "400": "#5c95d4", "500": "#3777c0", "600": "#275da2" },
		});
		expect(parseJsonPalette(input)).toEqual([
			{ name: "Cello", hex: "#3777c0" },
		]);
	});

	it("falls back to the shade numerically closest to 500", () => {
		const input = JSON.stringify({
			brand: {
				"100": { value: "#dcf1f1", type: "color" },
				"700": { value: "#31646d", type: "color" },
			},
		});
		expect(parseJsonPalette(input)).toEqual([
			{ name: "Brand", hex: "#31646d" },
		]);
	});

	it("parses DTCG tokens ($value string or { hex }) and flat hex maps", () => {
		const dtcg = JSON.stringify({
			emerald: {
				"500": {
					$type: "color",
					$value: { colorSpace: "srgb", components: [0.2, 0.8, 0.4], hex: "#32cd65" },
				},
			},
			accent: { $type: "color", $value: "#f67219" },
		});
		expect(parseJsonPalette(dtcg)).toEqual([
			{ name: "Emerald", hex: "#32cd65" },
			{ name: "Accent", hex: "#f67219" },
		]);
		expect(parseJsonPalette('{ "brand": "#1d3557" }')).toEqual([
			{ name: "Brand", hex: "#1d3557" },
		]);
	});

	it("returns an empty array for non-JSON, arrays, and colorless documents", () => {
		expect(parseJsonPalette("not json")).toEqual([]);
		expect(parseJsonPalette('["#ff0000"]')).toEqual([]);
		expect(parseJsonPalette('{ "fontSize": { "base": "16px" } }')).toEqual([]);
	});
});

describe("parsePaletteInput", () => {
	it("prefers named JSON colors when the input is a token document", () => {
		const input = JSON.stringify({
			bunker: { "500": { value: "#5d799a", type: "color" } },
		});
		expect(parsePaletteInput(input)).toEqual([
			{ name: "Bunker", hex: "#5d799a" },
		]);
	});

	it("falls back to plain hex extraction for non-JSON input", () => {
		expect(parsePaletteInput("https://coolors.co/264653-2a9d8f")).toEqual([
			{ hex: "#264653" },
			{ hex: "#2a9d8f" },
		]);
	});
});
