import { expect, test } from "@playwright/test";

async function pickHeadingFont(
	page: import("@playwright/test").Page,
	name: string,
): Promise<void> {
	await page.getByRole("tab", { name: "Font" }).click();
	// The Font tab starts with an "Add Fonts" button that reveals the pickers.
	const addFonts = page.getByRole("button", { name: /add fonts/i });
	if (await addFonts.isVisible().catch(() => false)) {
		await addFonts.click();
	}
	// The picker is a popover: the trigger carries the testid and the option
	// list is portaled to the body.
	await page.getByTestId("font-picker-heading").click();
	await page.getByRole("option", { name, exact: true }).click();
}

test("edits typography and exports it as Figma tokens", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await pickHeadingFont(page, "Roboto");
	await page.getByLabel("Base font size in pixels").fill("18");
	await expect.poll(() => page.url()).toContain("type=");

	await page.getByRole("button", { name: /get the code/i }).click();
	await page.getByRole("tab", { name: /figma \(tokens\)/i }).click();
	await expect(page.getByText(/"\$type": "fontFamily"/)).toBeVisible();
	await expect(page.getByText(/"Roboto"/)).toBeVisible();
	await expect(page.getByText(/"\$type": "dimension"/)).toBeVisible();
	await expect(page.getByText(/"unit": "px"/)).toBeVisible();
});

test("rehydrates typography from the URL", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await pickHeadingFont(page, "Roboto");
	await expect.poll(() => page.url()).toContain("type=");

	await page.goto(page.url());
	// Non-default typography in the URL keeps the Fonts tab populated (the
	// picker renders directly, without the "Add Fonts" step).
	await page.getByRole("tab", { name: "Font" }).click();
	await expect(page.getByTestId("font-picker-heading")).toContainText("Roboto");
});
