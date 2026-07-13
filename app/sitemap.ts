import type { MetadataRoute } from "next";

import { POPULAR_COLOR_HEXES } from "@/lib/seo";
import { GROWTH_PAGES } from "@/lib/growth-pages";
import { siteConfig } from "@/lib/site-config";

// No lastModified: stamping build time on every entry makes <lastmod>
// meaningless to crawlers, which is worse than omitting it.
export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: siteConfig.url,
			changeFrequency: "monthly",
			priority: 1,
		},
		{
			url: `${siteConfig.url}/terms`,
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${siteConfig.url}/privacy`,
			changeFrequency: "yearly",
			priority: 0.3,
		},
		...GROWTH_PAGES.map(({ slug }) => ({
			url: `${siteConfig.url}/tools/${slug}`,
			changeFrequency: "monthly" as const,
			priority: 0.8,
		})),
		...POPULAR_COLOR_HEXES.map((hex) => ({
			url: `${siteConfig.url}/generate/${hex}`,
			changeFrequency: "monthly" as const,
			priority: 0.7,
		})),
	];
}
