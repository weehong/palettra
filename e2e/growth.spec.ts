import { expect, test } from "@playwright/test";

test("high-intent landing page leads into a preconfigured generator", async ({
	page,
}) => {
	await page.goto("/tools/tailwind-v4-color-palette");
	await expect(
		page.getByRole("heading", {
			level: 1,
			name: /ready for Tailwind v4/i,
		}),
	).toBeVisible();
	await expect(
		page.getByText("--color-primary-500", { exact: false }),
	).toBeVisible();

	await page
		.getByRole("link", { name: /Generate a Tailwind v4 palette/i })
		.click();
	await expect(page).toHaveURL(/\/generate\/8b5cf6$/);
	await expect(page.getByTestId("swatch")).toHaveCount(11);
});

test("migration page clearly states the current product boundary", async ({
	page,
}) => {
	await page.goto("/tools/tailwind-v3-to-v4-colors");
	await expect(
		page.getByText(
			/does not parse and rewrite an existing Tailwind configuration/i,
		),
	).toBeVisible();
});
