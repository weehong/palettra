import { expect, test } from "@playwright/test";

async function metaContent(
	page: import("@playwright/test").Page,
	selector: string,
): Promise<string | null> {
	return page.locator(selector).first().getAttribute("content");
}

test("invalid hex routes return 404", async ({ page }) => {
	const response = await page.goto("/generate/zzzzzz");
	expect(response?.status()).toBe(404);
	await expect(page.getByText("This page could not be found.")).toBeVisible();
});

test("unknown routes render the not-found page", async ({ page }) => {
	const response = await page.goto("/this-route-does-not-exist");
	expect(response?.status()).toBe(404);
	await expect(page.getByText("This page could not be found.")).toBeVisible();
});

// The generate route restates the whole openGraph/twitter block because
// Next merges metadata shallowly — an easy field to drop in a refactor.
test("generate route emits canonical and social metadata", async ({ page }) => {
	await page.goto("/generate/a543bc");

	// The document title carries the layout's "— Palettra" suffix; og:title
	// (asserted below) restates the raw title without it.
	await expect(page).toHaveTitle(/\(#a543bc\) Tailwind color system/);

	const canonical = await page
		.locator('link[rel="canonical"]')
		.getAttribute("href");
	expect(canonical).toMatch(/\/generate\/a543bc$/);

	expect(await metaContent(page, 'meta[property="og:title"]')).toMatch(
		/\(#a543bc\) Tailwind color system$/,
	);
	expect(await metaContent(page, 'meta[property="og:url"]')).toMatch(
		/\/generate\/a543bc$/,
	);
	expect(await metaContent(page, 'meta[property="og:site_name"]')).toBe(
		"Palettra",
	);
	expect(await metaContent(page, 'meta[name="twitter:card"]')).toBe(
		"summary_large_image",
	);
});

test("home route sets a root canonical", async ({ page }) => {
	await page.goto("/");
	const canonical = await page
		.locator('link[rel="canonical"]')
		.getAttribute("href");
	// The home canonical is the site origin (trailing slash optional).
	expect(canonical).toMatch(/^https?:\/\/[^/]+\/?$/);
});

test("opengraph image responds", async ({ request, baseURL }) => {
	const response = await request.get(`${baseURL}/opengraph-image`);
	expect(response.ok()).toBe(true);
	expect(response.headers()["content-type"]).toContain("image");
});

test("robots.txt and sitemap.xml are served", async ({ request, baseURL }) => {
	const robots = await request.get(`${baseURL}/robots.txt`);
	expect(robots.ok()).toBe(true);
	// The Sitemap line only appears on indexable (production) builds, so
	// assert the always-present user-agent rule instead.
	expect(await robots.text()).toMatch(/User-Agent/i);

	const sitemap = await request.get(`${baseURL}/sitemap.xml`);
	expect(sitemap.ok()).toBe(true);
	expect(await sitemap.text()).toContain("/generate/");
});
