import { expect, test } from "@playwright/test";

test("exports the multi-role theme as Tailwind v4 OKLCH", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: /get the code/i }).click();
	await page.getByRole("tab", { name: /tailwind v4/i }).click();
	await expect(page.getByText(/oklch\(/)).toBeVisible();
	await expect(page.getByText(/--color-primary-500/)).toBeVisible();
});

test("exports the theme as Figma DTCG tokens", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: /get the code/i }).click();
	await page.getByRole("tab", { name: /figma \(tokens\)/i }).click();
	await expect(page.getByText(/"\$value"/)).toBeVisible();
	await expect(page.getByText(/"primary"/)).toBeVisible();
	await expect(page.getByRole("button", { name: /download/i })).toBeVisible();
});

// R6 — Download produces a file and Copy toggles its label.
test("downloads the Figma tokens file", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: /get the code/i }).click();
	await page.getByRole("tab", { name: /figma \(tokens\)/i }).click();

	const downloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: /download/i }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe("figma-tokens.json");
});

test("Copy toggles to a confirmation label", async ({ page, context }) => {
	// The dialog copies to the clipboard; grant access for chromium.
	await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(
		() => {
			// Firefox/WebKit don't support these permission names; the label
			// toggle below doesn't depend on the grant.
		},
	);
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: /get the code/i }).click();
	await page.getByRole("tab", { name: /tailwind v4/i }).click();

	await page.getByRole("button", { name: "Copy", exact: true }).click();
	await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
});
