import { expect, test } from "@playwright/test";

test("exports the multi-role theme as Tailwind v4 OKLCH", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: "Export" }).click();
	await page.getByRole("tab", { name: /tailwind v4/i }).click();
	await expect(page.getByText(/oklch\(/)).toBeVisible();
	await expect(page.getByText(/--color-primary-500/)).toBeVisible();
});

test("exports the theme as Figma DTCG tokens", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: "Export" }).click();
	await page.getByRole("tab", { name: /figma \(tokens\)/i }).click();
	await expect(page.getByText(/"\$value"/)).toBeVisible();
	await expect(page.getByText(/"primary"/)).toBeVisible();
	await expect(page.getByRole("button", { name: /download/i })).toBeVisible();
});

// R6 — Download produces a file and Copy toggles its label.
test("downloads the Figma tokens file", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: "Export" }).click();
	await page.getByRole("tab", { name: /figma \(tokens\)/i }).click();

	const downloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: /download/i }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe("figma-tokens.json");
});

test("uses and preserves semantic Figma aliases", async ({ page }) => {
	await page.goto("/generate/808080");
	await page.getByRole("textbox", { name: "Primary name" }).fill("Gray");
	await page
		.getByRole("textbox", { name: "200 semantic name" })
		.fill("surface-muted");
	await page.getByRole("button", { name: "Export" }).click();
	await page.getByRole("tab", { name: /figma \(tokens\)/i }).click();

	const dialog = page.getByRole("dialog", { name: "Export theme" });
	const copy = page.getByRole("button", { name: "Copy", exact: true });
	await expect(copy).toBeEnabled();
	await expect(
		dialog.getByRole("heading", { name: "Semantic names" }),
	).toHaveCount(0);
	await expect(dialog.getByRole("textbox")).toHaveCount(0);
	await expect(page.getByText(/"surface-muted"/)).toBeVisible();
	await expect(page.getByText(/\{gray\.200\}/)).toBeVisible();
	await expect(page).toHaveURL(/semantic=0~200~surface-muted/);
	await expect(page).not.toHaveURL(/semanticLocked/);
});

test("shows semantic-name validation without the duplicate editor", async ({
	page,
}) => {
	await page.goto("/generate/808080");
	await page
		.getByRole("textbox", { name: "200 semantic name" })
		.fill("surface.muted");
	await page.getByRole("button", { name: "Export" }).click();
	await page.getByRole("tab", { name: /figma \(tokens\)/i }).click();

	await expect(page.getByRole("alert")).toContainText(
		"Fix semantic names on the palette before exporting",
	);
	await expect(
		page.getByRole("button", { name: "Copy", exact: true }),
	).toBeDisabled();
});

test("Copy toggles to a confirmation label", async ({ page, context }) => {
	// The dialog copies to the clipboard; grant access for chromium.
	await context
		.grantPermissions(["clipboard-read", "clipboard-write"])
		.catch(() => {
			// Firefox/WebKit don't support these permission names; the label
			// toggle below doesn't depend on the grant.
		});
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: "Export" }).click();
	await page.getByRole("tab", { name: /tailwind v4/i }).click();

	await page.getByRole("button", { name: "Copy", exact: true }).click();
	await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
});

test("copies the shareable palette link from the export dialog", async ({
	page,
	context,
}) => {
	await context
		.grantPermissions(["clipboard-read", "clipboard-write"])
		.catch(() => {});
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: "Export" }).click();

	await page.getByRole("button", { name: "Copy share link" }).click();
	await expect(
		page.getByRole("button", { name: "Link copied!" }),
	).toBeVisible();
});
