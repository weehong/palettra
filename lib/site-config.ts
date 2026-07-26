/**
 * Central site configuration.
 *
 * Keep all SEO, branding, and social values here so metadata, manifest,
 * structured data, and Open Graph images stay in sync from a single source.
 */

const PRODUCTION_SITE_URL = "https://palettra.design";
const LOCAL_SITE_URL = "http://localhost:3000";

function isLoopbackUrl(value: string): boolean {
	try {
		const hostname = new URL(value).hostname;
		return (
			hostname === "localhost" ||
			hostname === "127.0.0.1" ||
			hostname === "[::1]"
		);
	} catch {
		return false;
	}
}

function resolveSiteUrl(): string {
	const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
	if (
		fromEnv &&
		fromEnv.length > 0 &&
		!(process.env.NODE_ENV === "production" && isLoopbackUrl(fromEnv))
	) {
		return fromEnv.replace(/\/$/, "");
	}
	// Canonical production URLs must never drift to a Vercel hostname when the
	// custom-domain environment variable is missing or misconfigured.
	if (process.env.NODE_ENV === "production") {
		return PRODUCTION_SITE_URL;
	}
	return LOCAL_SITE_URL;
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
