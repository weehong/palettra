import { expect, test } from "@playwright/test";

// A minimal but valid Stitch spec: primary + four preset-anchor tokens
// project onto five fixed roles (55 swatches).
const STITCH_SPEC = `---
name: E2E Spec
colors:
  primary: '#9f0026'
  secondary: '#5c5f4a'
  tertiary: '#7d5260'
  error: '#ba1a1a'
  outline: '#857370'
---

## Brand & Style

A minimal spec for end-to-end import testing.
`;

// Importing over an existing palette overwrites the roles and gates behind
// a confirmation step (any existing role triggers it).
test("imports a Coolors palette after confirming the overwrite", async ({
	page,
}) => {
	await page.goto("/generate/a543bc");
	await expect(page.getByTestId("swatch")).toHaveCount(11);

	await page.getByTestId("import-menu").click();
	await page.getByTestId("import-palette").click();
	await page
		.getByLabel("Coolors URL, hex list, or uicolors.app JSON")
		.fill("https://coolors.co/264653-2a9d8f-e9c46a");

	// First click surfaces the overwrite warning instead of importing.
	await page.getByRole("button", { name: /import 3 colors/i }).click();
	await expect(
		page.getByText("Save your current palette before importing."),
	).toBeVisible();

	// Confirming replaces the palette with the three imported roles.
	await page.getByRole("button", { name: "Import colors" }).click();
	await expect(page.getByTestId("swatch")).toHaveCount(33);
});

// R5 — backing out of the confirmation leaves the current palette intact.
test("backing out of the import confirmation keeps the palette", async ({
	page,
}) => {
	await page.goto("/generate/a543bc");
	await expect(page.getByTestId("swatch")).toHaveCount(11);

	await page.getByTestId("import-menu").click();
	await page.getByTestId("import-palette").click();
	await page
		.getByLabel("Coolors URL, hex list, or uicolors.app JSON")
		.fill("https://coolors.co/264653-2a9d8f-e9c46a");

	await page.getByRole("button", { name: /import 3 colors/i }).click();
	await expect(
		page.getByText("Save your current palette before importing."),
	).toBeVisible();

	// "Review import" returns to the input without applying the import.
	await page.getByRole("button", { name: "Review import" }).click();
	await expect(
		page.getByText("Save your current palette before importing."),
	).toBeHidden();
	await page.getByRole("button", { name: "Close" }).click();
	await expect(page.getByTestId("swatch")).toHaveCount(11);
});

// R7 — the Stitch importer projects a spec onto fixed roles and renders its
// read-only token inspector. Inactive tab panels unmount, so the whole-page
// swatch count reflects only the active Color tab (primary + secondary +
// tertiary = 33); error and neutral land in the Status/Neutral tabs.
test("imports a Google Stitch spec", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await expect(page.getByTestId("swatch")).toHaveCount(11);

	await page.getByTestId("import-menu").click();
	await page.getByTestId("import-stitch").click();

	await page.getByLabel("Stitch spec markdown").fill(STITCH_SPEC);
	await page.getByRole("button", { name: "Import spec" }).click();

	// The spec's primary anchor becomes the primary role.
	await expect(page.getByLabel("Primary hex")).toHaveValue("#9f0026");
	// Color tab shows primary + secondary + tertiary.
	await expect(page.getByTestId("swatch")).toHaveCount(33);
	// The read-only Stitch token inspector confirms the full spec imported.
	await expect(
		page.getByRole("region", { name: "Stitch design tokens" }),
	).toBeVisible();
	// The neutral anchor (outline) lands in the Neutral tab.
	await page.getByRole("tab", { name: "Neutral" }).click();
	await expect(page.getByTestId("swatch")).toHaveCount(11);
});
