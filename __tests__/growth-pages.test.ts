import { describe, expect, it } from "vitest";

import { GROWTH_PAGES, getGrowthPage } from "@/lib/growth-pages";

describe("growth landing pages", () => {
	it("use unique slugs and route every CTA to a shareable generator", () => {
		const slugs = GROWTH_PAGES.map(({ slug }) => slug);
		expect(new Set(slugs).size).toBe(slugs.length);

		for (const page of GROWTH_PAGES) {
			expect(getGrowthPage(page.slug)).toBe(page);
			expect(page.ctaHref).toMatch(/^\/generate\/[0-9a-f]{6}$/);
			expect(page.faq.length).toBeGreaterThanOrEqual(2);
		}
	});

	it("does not claim to auto-migrate v3 configs or import Figma files", () => {
		const migration = getGrowthPage("tailwind-v3-to-v4-colors");
		const figma = getGrowthPage("figma-design-tokens");

		expect(migration?.faq.map(({ answer }) => answer).join(" ")).toMatch(
			/does not parse and rewrite/i,
		);
		expect(figma?.faq.map(({ answer }) => answer).join(" ")).toMatch(
			/does not read native Figma files/i,
		);
	});
});
