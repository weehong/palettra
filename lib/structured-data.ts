import type {
	WithContext,
	WebSite,
	WebApplication,
	Organization,
} from "schema-dts";

import { siteConfig } from "@/lib/site-config";

/**
 * JSON-LD structured data builders.
 *
 * These produce schema.org objects consumed by {@link "@/components/json-ld"}
 * to improve how search engines understand the site.
 */

export function getWebSiteStructuredData(): WithContext<WebSite> {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: siteConfig.name,
		url: siteConfig.url,
		description: siteConfig.description,
	};
}

export function getWebApplicationStructuredData(): WithContext<WebApplication> {
	return {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: siteConfig.name,
		url: siteConfig.url,
		description: siteConfig.description,
		applicationCategory: "DesignApplication",
		operatingSystem: "Web",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
	};
}

export function getOrganizationStructuredData(): WithContext<Organization> {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: siteConfig.name,
		url: siteConfig.url,
		description: siteConfig.description,
	};
}
