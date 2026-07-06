/**
 * Central site configuration.
 *
 * Keep all SEO, branding, and social values here so metadata, manifest,
 * structured data, and Open Graph images stay in sync from a single source.
 */

const DEFAULT_SITE_URL = "http://localhost:3000";

function resolveSiteUrl(): string {
	const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
	if (fromEnv && fromEnv.length > 0) {
		return fromEnv.replace(/\/$/, "");
	}
	// Vercel injects the project's production domain (e.g. <project>.vercel.app)
	// into every deployment. Preferring it over the per-deployment VERCEL_URL
	// keeps canonicals, sitemap, and OG URLs pointed at one stable origin even
	// on preview deployments.
	const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
	if (vercelProductionUrl && vercelProductionUrl.length > 0) {
		return `https://${vercelProductionUrl}`;
	}
	const vercelUrl = process.env.VERCEL_URL;
	if (vercelUrl && vercelUrl.length > 0) {
		return `https://${vercelUrl}`;
	}
	return DEFAULT_SITE_URL;
}

export type SiteConfig = {
	name: string;
	title: string;
	description: string;
	headline: string;
	/** Sidebar feature summary, rendered as bullet points. */
	caption: ReadonlyArray<string>;
	socialHeadline: string;
	url: string;
	author: string;
	keywords: Array<string>;
	locale: string;
	themeColor: string;
	backgroundColor: string;
	twitterHandle: string;
};

export const siteConfig: SiteConfig = {
	name: "Palettra",
	title: "Palettra — Tailwind Color System Generator",
	description:
		"Turn any hex into a complete Tailwind design system — OKLCH-tuned 50–950 scales, neutral and status palettes, font pairing, real UI previews with WCAG grades, and exports for Tailwind v3/v4, CSS variables, and Figma tokens.",
	headline: "Palettra",
	caption: [
		"Start from one hex and build the whole system: OKLCH-based 50–950 scales, neutral and status palettes, and curated font pairings.",
		"Import palettes from Coolors, UIColors, or Google Stitch.",
		"Preview them across ten real UI patterns with WCAG contrast grades.",
		"Export clean tokens for Tailwind v3, Tailwind v4, CSS variables, or Figma — all from a shareable URL.",
	],
	socialHeadline: "Design Tailwind color systems that are ready to ship",
	url: resolveSiteUrl(),
	author: "Palettra",
	keywords: [
		"Tailwind CSS",
		"Tailwind color system generator",
		"color palette generator",
		"color shades",
		"OKLCH",
		"design tokens",
		"UI color preview",
		"Figma design tokens",
		"font pairing",
		"WCAG contrast",
		"Google Stitch",
		"Palettra",
	],
	locale: "en_US",
	themeColor: "#006d77",
	backgroundColor: "#edf6f9",
	twitterHandle: "@palettra",
};

/**
 * Whether this deployment should be indexable by search engines.
 *
 * Only production deployments are indexable; everything else stays private so
 * staging and preview environments never leak into search results. On Vercel,
 * NODE_ENV is "production" for preview deployments too, so VERCEL_ENV is the
 * authoritative signal when present.
 */
export const isIndexable: boolean =
	process.env.VERCEL_ENV !== undefined
		? process.env.VERCEL_ENV === "production"
		: process.env.NODE_ENV === "production";
