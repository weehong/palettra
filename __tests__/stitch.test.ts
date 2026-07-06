import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
	parseStitchSpec,
	serializeStitchSpec,
	splitFrontmatter,
	stitchToCssVars,
	stitchToDtcg,
	stitchToTheme,
} from "@/lib/stitch";

const SAMPLE = readFileSync(
	join(process.cwd(), "__tests__/fixtures/stitch-sample.md"),
	"utf8",
);

describe("splitFrontmatter", () => {
	it("splits a fenced frontmatter block from the body", () => {
		const { frontmatter, body } = splitFrontmatter(SAMPLE);
		expect(frontmatter).toContain("name: Kinetic Precision");
		expect(body).toContain("## Brand & Style");
		expect(frontmatter).not.toContain("## Brand & Style");
	});

	it("returns null frontmatter when there is no fenced block", () => {
		const { frontmatter, body } = splitFrontmatter("# Just a doc\n\nbody");
		expect(frontmatter).toBeNull();
		expect(body).toBe("# Just a doc\n\nbody");
	});

	it("returns null frontmatter for a malformed (unclosed) fence", () => {
		expect(splitFrontmatter("---\ncolors:\n  primary: '#fff'\n").frontmatter)
			.toBeNull();
	});
});

describe("parseStitchSpec", () => {
	const spec = parseStitchSpec(SAMPLE);

	it("captures every color token, normalizing hex", () => {
		expect(Object.keys(spec.colors)).toHaveLength(47);
		expect(spec.colors.primary).toBe("#9f0026");
		expect(spec.colors["on-primary-fixed-variant"]).toBe("#920022");
		expect(spec.colors["surface-container-highest"]).toBe("#fbdbdb");
	});

	it("captures named type styles verbatim, including units", () => {
		expect(spec.typography["display-lg"]).toEqual({
			fontFamily: "Poppins",
			fontSize: "48px",
			fontWeight: "700",
			lineHeight: "1.1",
			letterSpacing: "-0.02em",
		});
		// A style without letterSpacing keeps only its present fields.
		expect(spec.typography["body-md"]).toEqual({
			fontFamily: "Poppins",
			fontSize: "16px",
			fontWeight: "400",
			lineHeight: "1.5",
		});
	});

	it("captures the radius and spacing scales, including the DEFAULT key", () => {
		expect(spec.rounded.DEFAULT).toBe("0.5rem");
		expect(spec.rounded.full).toBe("9999px");
		expect(spec.spacing["stack-lg"]).toBe("48px");
		expect(spec.spacing["container-max"]).toBe("1280px");
	});

	it("records frontmatter key order and unmodeled keys", () => {
		expect(spec.frontmatterKeyOrder).toEqual([
			"name",
			"colors",
			"typography",
			"rounded",
			"spacing",
		]);
		expect(spec.extraFrontmatter).toEqual({ name: "Kinetic Precision" });
	});

	it("captures prose sections with verbatim bodies", () => {
		expect(spec.sections.map((s) => s.heading)).toEqual([
			"Brand & Style",
			"Typography",
			"Shapes",
		]);
		const brand = spec.sections[0];
		expect(brand.level).toBe(2);
		expect(brand.body).toContain("high-energy professionality");
		expect(brand.body).toContain("- **Minimalism:**");
	});
});

describe("round-trip", () => {
	it("is structurally stable: parse(serialize(parse(md))) deep-equals parse(md)", () => {
		const once = parseStitchSpec(SAMPLE);
		const twice = parseStitchSpec(serializeStitchSpec(once));
		// `raw` is the original source bytes by design, so compare modeled content.
		const { raw: _a, ...onceModeled } = once;
		const { raw: _b, ...twiceModeled } = twice;
		expect(twiceModeled).toEqual(onceModeled);
	});

	it("serializes idempotently", () => {
		const out = serializeStitchSpec(parseStitchSpec(SAMPLE));
		const again = serializeStitchSpec(parseStitchSpec(out));
		expect(again).toBe(out);
	});

	it("preserves the unmodeled `name` and all color values through a round-trip", () => {
		const out = serializeStitchSpec(parseStitchSpec(SAMPLE));
		expect(out).toContain("name: Kinetic Precision");
		expect(out).toContain("primary: '#9f0026'");
		expect(out).toContain("## Brand & Style");
	});
});

describe("bridges", () => {
	const spec = parseStitchSpec(SAMPLE);

	it("stitchToTheme seeds fixed primary/secondary/tertiary/error/neutral roles", () => {
		const { roles } = stitchToTheme(spec);
		expect(roles[0]).toMatchObject({
			id: "primary",
			hex: "#9f0026",
			auto: false,
		});
		const presets = roles.slice(1).map((r) => r.preset);
		expect(presets).toEqual(["secondary", "tertiary", "error", "neutral"]);
		expect(roles.every((r) => r.auto === false)).toBe(true);
		// Secondary keeps the spec's exact hex rather than a derived one.
		expect(roles[1].hex).toBe("#5f5e5e");
	});

	it("stitchToCssVars emits flat, suffix-free MD3 vars plus scales", () => {
		const vars = stitchToCssVars(spec);
		expect(vars["--on-primary"]).toBe("#ffffff");
		expect(vars["--surface-container-high"]).toBe("#ffe1e1");
		expect(vars["--radius"]).toBe("0.5rem");
		expect(vars["--radius-full"]).toBe("9999px");
		expect(vars["--spacing-stack-lg"]).toBe("48px");
		expect(vars["--type-display-lg-font-size"]).toBe("48px");
	});

	it("stitchToDtcg is valid JSON with color + dimension + typography tokens", () => {
		const doc = JSON.parse(stitchToDtcg(spec)) as {
			color: Record<string, { $type: string; $value: { hex: string } }>;
			radius: Record<string, { $type: string; $value: unknown }>;
			spacing: Record<string, { $type: string }>;
			typography: Record<string, { $type: string }>;
		};
		expect(doc.color.primary.$type).toBe("color");
		expect(doc.color.primary.$value.hex).toBe("#9f0026");
		expect(doc.radius.full.$type).toBe("dimension");
		expect(doc.radius.full.$value).toEqual({ value: 9999, unit: "px" });
		expect(doc.spacing["stack-lg"].$type).toBe("dimension");
		expect(doc.typography["display-lg"].$type).toBe("typography");
	});
});
