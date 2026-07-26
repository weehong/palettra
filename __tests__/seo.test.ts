import { afterEach, describe, expect, it, vi } from "vitest";

import { POPULAR_COLOR_HEXES } from "@/lib/seo";
import { GROWTH_PAGES } from "@/lib/growth-pages";

/**
 * site-config resolves its URL and indexability at module load, so each
 * scenario stubs the environment and re-imports a fresh copy of the module
 * graph.
 */
async function loadSiteConfig(env: Record<string, string | undefined>) {
	vi.resetModules();
	for (const [key, value] of Object.entries(env)) {
		if (value === undefined) {
			vi.stubEnv(key, "");
			delete process.env[key];
		} else {
			vi.stubEnv(key, value);
		}
	}
	return import("@/lib/site-config");
}

afterEach(() => {
	vi.unstubAllEnvs();
	vi.resetModules();
});

describe("siteConfig.url resolution", () => {
	it("prefers NEXT_PUBLIC_SITE_URL and strips a trailing slash", async () => {
		const { siteConfig } = await loadSiteConfig({
			NEXT_PUBLIC_SITE_URL: "https://palettra.example/",
			VERCEL_PROJECT_PRODUCTION_URL: "ui-color-picker-preview.vercel.app",
		});
		expect(siteConfig.url).toBe("https://palettra.example");
	});

	it("defaults to localhost outside Vercel", async () => {
		const { siteConfig } = await loadSiteConfig({
			NEXT_PUBLIC_SITE_URL: undefined,
			VERCEL_PROJECT_PRODUCTION_URL: undefined,
			VERCEL_URL: undefined,
			NODE_ENV: "development",
		});
		expect(siteConfig.url).toBe("http://localhost:3000");
	});

	it("defaults to the canonical domain when production URL variables are missing", async () => {
		const { siteConfig } = await loadSiteConfig({
			NEXT_PUBLIC_SITE_URL: undefined,
			VERCEL_PROJECT_PRODUCTION_URL: undefined,
			VERCEL_URL: undefined,
			NODE_ENV: "production",
		});
		expect(siteConfig.url).toBe("https://palettra.design");
	});

	it("keeps production canonicals on the custom domain instead of a Vercel hostname", async () => {
		const { siteConfig } = await loadSiteConfig({
			NEXT_PUBLIC_SITE_URL: undefined,
			VERCEL_PROJECT_PRODUCTION_URL: "ui-color-picker-preview.vercel.app",
			VERCEL_URL: "ui-color-picker-preview-abc123.vercel.app",
			NODE_ENV: "production",
		});
		expect(siteConfig.url).toBe("https://palettra.design");
	});

	it("does not publish a loopback URL from a production build", async () => {
		const { siteConfig } = await loadSiteConfig({
			NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
			VERCEL_PROJECT_PRODUCTION_URL: undefined,
			VERCEL_URL: undefined,
			NODE_ENV: "production",
		});
		expect(siteConfig.url).toBe("https://palettra.design");
	});
});

describe("isIndexable", () => {
	it("is true on Vercel production deployments", async () => {
		const { isIndexable } = await loadSiteConfig({
			VERCEL_ENV: "production",
		});
		expect(isIndexable).toBe(true);
	});

	it("is false on Vercel preview deployments even though NODE_ENV is production there", async () => {
		const { isIndexable } = await loadSiteConfig({
			VERCEL_ENV: "preview",
		});
		expect(isIndexable).toBe(false);
	});

	it("is false in local test runs", async () => {
		const { isIndexable } = await loadSiteConfig({
			VERCEL_ENV: undefined,
		});
		expect(isIndexable).toBe(false);
	});

	it("falls back to NODE_ENV when not on Vercel (self-hosted production)", async () => {
		const { isIndexable } = await loadSiteConfig({
			VERCEL_ENV: undefined,
			NODE_ENV: "production",
		});
		expect(isIndexable).toBe(true);
	});
});

describe("sitemap", () => {
	it("lists the home page and every popular color page under the site origin", async () => {
		const { siteConfig } = await loadSiteConfig({
			NEXT_PUBLIC_SITE_URL: "https://ui-color-picker-preview.vercel.app",
		});
		const { default: sitemap } = await import("@/app/sitemap");
		const entries = sitemap();

		expect(entries).toHaveLength(
			3 + GROWTH_PAGES.length + POPULAR_COLOR_HEXES.length,
		);
		expect(entries[0]?.url).toBe(siteConfig.url);
		expect(entries.some((e) => e.url === `${siteConfig.url}/terms`)).toBe(true);
		expect(entries.some((e) => e.url === `${siteConfig.url}/privacy`)).toBe(
			true,
		);
		for (const entry of entries) {
			expect(entry.url.startsWith(siteConfig.url)).toBe(true);
		}
		for (const hex of POPULAR_COLOR_HEXES) {
			expect(entries.some((e) => e.url.endsWith(`/generate/${hex}`))).toBe(
				true,
			);
		}
		for (const { slug } of GROWTH_PAGES) {
			expect(entries.some((e) => e.url.endsWith(`/tools/${slug}`))).toBe(true);
		}
	});

	it("uses lowercase hex route segments without a leading #", () => {
		for (const hex of POPULAR_COLOR_HEXES) {
			expect(hex).toMatch(/^[0-9a-f]{6}$/);
		}
	});
});

describe("robots", () => {
	it("blocks all crawlers when not indexable", async () => {
		await loadSiteConfig({ VERCEL_ENV: "preview" });
		const { default: robots } = await import("@/app/robots");
		expect(robots()).toEqual({
			rules: { userAgent: "*", disallow: "/" },
		});
	});

	it("allows crawling and advertises the sitemap in production", async () => {
		const { siteConfig } = await loadSiteConfig({
			VERCEL_ENV: "production",
			NEXT_PUBLIC_SITE_URL: "https://ui-color-picker-preview.vercel.app",
		});
		const { default: robots } = await import("@/app/robots");
		const result = robots();
		expect(result.rules).toEqual({ userAgent: "*", allow: "/" });
		expect(result.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
	});
});

describe("generated color metadata", () => {
	it("allows curated color pages to inherit the site's index policy", async () => {
		const { generateMetadata } = await import("@/app/generate/[hex]/page");
		const metadata = await generateMetadata({
			params: Promise.resolve({ hex: POPULAR_COLOR_HEXES[0] }),
			searchParams: Promise.resolve({}),
		});

		expect(metadata.robots).toBeUndefined();
	});

	it("prevents arbitrary generated color pages from entering the index", async () => {
		const { generateMetadata } = await import("@/app/generate/[hex]/page");
		const metadata = await generateMetadata({
			params: Promise.resolve({ hex: "a543bc" }),
			searchParams: Promise.resolve({}),
		});

		expect(metadata.robots).toEqual({
			index: false,
			follow: true,
			googleBot: { index: false, follow: true },
		});
	});
});

describe("structured data", () => {
	it("emits WebSite, WebApplication, and Organization schemas bound to the site origin", async () => {
		const { siteConfig } = await loadSiteConfig({
			NEXT_PUBLIC_SITE_URL: "https://ui-color-picker-preview.vercel.app",
		});
		const {
			getWebSiteStructuredData,
			getWebApplicationStructuredData,
			getOrganizationStructuredData,
		} = await import("@/lib/structured-data");

		const webSite = getWebSiteStructuredData();
		const webApp = getWebApplicationStructuredData();
		const organization = getOrganizationStructuredData();

		// schema-dts models these as narrow union types; index as records to
		// read the JSON-LD fields under test.
		const schemas = [webSite, webApp, organization] as unknown as ReadonlyArray<
			Record<string, unknown>
		>;
		expect(schemas[0]["@type"]).toBe("WebSite");
		expect(schemas[1]["@type"]).toBe("WebApplication");
		expect(schemas[2]["@type"]).toBe("Organization");
		for (const schema of schemas) {
			expect(schema["@context"]).toBe("https://schema.org");
			expect(schema.url).toBe(siteConfig.url);
		}
	});
});
