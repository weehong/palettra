import type { MetadataRoute } from "next";

import { siteConfig, isIndexable } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
	if (!isIndexable) {
		// Keep non-production deployments out of search indexes entirely.
		return {
			rules: {
				userAgent: "*",
				disallow: "/",
			},
		};
	}

	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		sitemap: `${siteConfig.url}/sitemap.xml`,
	};
}
