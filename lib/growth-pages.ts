export type GrowthPage = {
	slug: string;
	title: string;
	description: string;
	eyebrow: string;
	headline: string;
	intro: string;
	benefits: ReadonlyArray<string>;
	exampleTitle: string;
	example: string;
	faq: ReadonlyArray<{ question: string; answer: string }>;
	ctaLabel: string;
	ctaHref: string;
};

export const GROWTH_PAGES: ReadonlyArray<GrowthPage> = [
	{
		slug: "tailwind-v4-color-palette",
		title: "Tailwind v4 Color Palette Generator",
		description:
			"Generate an OKLCH 50–950 color scale and export it as Tailwind CSS v4 @theme variables.",
		eyebrow: "Tailwind CSS v4",
		headline: "Build an OKLCH palette that is ready for Tailwind v4",
		intro:
			"Start with one color, tune the complete scale in a real interface, and copy CSS-first theme variables directly into your project.",
		benefits: [
			"Eleven perceptually tuned shades from 50 through 950",
			"CSS-first @theme output using OKLCH values",
			"UI previews and visible WCAG contrast grades before export",
		],
		exampleTitle: "Tailwind v4 output",
		example: `@theme {
  --color-primary-50: oklch(0.97 0.02 292);
  --color-primary-500: oklch(0.55 0.19 292);
  --color-primary-950: oklch(0.22 0.08 292);
}`,
		faq: [
			{
				question: "Does this use Tailwind v4 syntax?",
				answer:
					"Yes. The v4 export is a CSS @theme block whose --color-* variables generate Tailwind color utilities.",
			},
			{
				question: "Can I still export for Tailwind v3?",
				answer:
					"Yes. The same palette can be exported as a v3 theme.extend.colors configuration.",
			},
		],
		ctaLabel: "Generate a Tailwind v4 palette",
		ctaHref: "/generate/8b5cf6",
	},
	{
		slug: "tailwind-v3-to-v4-colors",
		title: "Tailwind v3 to v4 Color Syntax Guide",
		description:
			"Compare Tailwind v3 color configuration with Tailwind v4 @theme syntax and generate either format.",
		eyebrow: "Tailwind migration",
		headline: "See the Tailwind v3 → v4 color syntax shift side by side",
		intro:
			"Palettra generates the same color system in both formats, making it easy to copy the output that matches your project version.",
		benefits: [
			"Tailwind v3 JavaScript theme.extend.colors output",
			"Tailwind v4 CSS-first @theme output",
			"One palette model shared across both export formats",
		],
		exampleTitle: "The syntax change",
		example: `/* Tailwind v4 */
@theme { --color-brand-500: oklch(0.62 0.18 250); }

/* Tailwind v3 */
theme: { extend: { colors: {
  brand: { 500: "#168eea" }
} } }`,
		faq: [
			{
				question: "Does Palettra migrate an existing v3 config automatically?",
				answer:
					"No. It generates v3 and v4 exports from a Palettra palette, but it does not parse and rewrite an existing Tailwind configuration.",
			},
			{
				question: "Do I have to rebuild the palette for v4?",
				answer:
					"No. Open the same shareable palette and select the Tailwind v4 export tab.",
			},
		],
		ctaLabel: "Create both export formats",
		ctaHref: "/generate/168eea",
	},
	{
		slug: "oklch-palette-generator",
		title: "OKLCH Color Palette Generator",
		description:
			"Turn a HEX color into a perceptually tuned OKLCH scale with UI previews and Tailwind v4 export.",
		eyebrow: "Perceptual color",
		headline: "Generate balanced OKLCH shades from a single color",
		intro:
			"Create predictable lightness steps while keeping every generated color inside the sRGB gamut used by the web.",
		benefits: [
			"Perceptually smoother light-to-dark progression",
			"sRGB-gamut-clamped values for dependable browser output",
			"HEX, CSS variable, Tailwind, and Figma token exports",
		],
		exampleTitle: "Portable OKLCH tokens",
		example: `--color-teal-100: oklch(0.93 0.04 190);
--color-teal-500: oklch(0.62 0.12 190);
--color-teal-900: oklch(0.32 0.06 190);`,
		faq: [
			{
				question: "Why use OKLCH for a color scale?",
				answer:
					"OKLCH separates lightness, chroma, and hue, which makes shade progression easier to reason about than RGB interpolation.",
			},
			{
				question: "Can I export HEX values too?",
				answer: "Yes. Every palette can also be copied as HEX values.",
			},
		],
		ctaLabel: "Generate an OKLCH scale",
		ctaHref: "/generate/14b8a6",
	},
	{
		slug: "wcag-tailwind-color-checker",
		title: "WCAG Contrast Preview for Tailwind Colors",
		description:
			"Preview generated Tailwind palettes with separate WCAG AA thresholds for normal and large text.",
		eyebrow: "Accessible color systems",
		headline: "Check Tailwind palette contrast in realistic UI previews",
		intro:
			"Palettra calculates the WCAG contrast ratio for generated text-and-background examples and labels normal-text and large-text outcomes separately.",
		benefits: [
			"AA normal-text threshold shown at 4.5:1",
			"AA large-text threshold shown at 3:1",
			"Real component previews beyond isolated color swatches",
		],
		exampleTitle: "How results are labeled",
		example: `7.0:1+  → AAA
4.5:1+  → AA (normal text)
3.0:1+  → AA Large
below 3 → Fail`,
		faq: [
			{
				question: "Are normal and large text checked separately?",
				answer:
					"Yes. Ratios from 3:1 to below 4.5:1 are labeled AA Large rather than passing for normal text.",
			},
			{
				question: "Does a passing palette guarantee an accessible product?",
				answer:
					"No. Contrast is one accessibility requirement; final components, states, typography, and context still need testing.",
			},
		],
		ctaLabel: "Preview palette contrast",
		ctaHref: "/generate/006d77",
	},
	{
		slug: "figma-design-tokens",
		title: "Figma Color Token Generator",
		description:
			"Generate DTCG color and typography tokens for Figma alongside Tailwind and CSS exports.",
		eyebrow: "Design tokens",
		headline: "Keep Figma and Tailwind colors based on the same palette",
		intro:
			"Name semantic aliases, lock the mapping for review, and export DTCG-compatible JSON together with developer-ready formats.",
		benefits: [
			"Primitive 50–950 color tokens",
			"Optional semantic aliases with collision validation",
			"Typography tokens and Tailwind exports from the same theme",
		],
		exampleTitle: "DTCG token output",
		example: `"primary": {
  "500": {
    "$type": "color",
    "$value": { "colorSpace": "srgb", "components": [...] }
  }
}`,
		faq: [
			{
				question: "Does Palettra import a Figma file?",
				answer:
					"No. It exports design-token JSON that can be used in a Figma token workflow; it does not read native Figma files.",
			},
			{
				question: "Can semantic token names be reviewed before export?",
				answer:
					"Yes. Semantic names must be valid and unique, then explicitly locked before the Figma export is enabled.",
			},
		],
		ctaLabel: "Create design tokens",
		ctaHref: "/generate/ec4899",
	},
];

export function getGrowthPage(slug: string): GrowthPage | undefined {
	return GROWTH_PAGES.find((page) => page.slug === slug);
}
