import { expect, test } from "@playwright/test";

test("preview shows the informative Design System board", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: /^preview$/i }).click();

	const overlay = page.getByTestId("preview-overlay");
	// The overlay covers the generator workspace.
	await expect(overlay).toBeVisible();
	// Design system is the only template offered in the preview.
	await expect(
		overlay.getByRole("tab", { name: "Design system" }),
	).toHaveAttribute("aria-selected", "true");
	await expect(overlay.getByRole("tab")).toHaveCount(1);

	// Section headings and informative content are present.
	await expect(overlay.getByRole("heading", { name: "Color" })).toBeVisible();
	await expect(
		overlay.getByRole("heading", { name: "Typography" }),
	).toBeVisible();
	await expect(
		overlay.getByRole("heading", { name: "Foundations" }),
	).toBeVisible();
	// Labeled ramp + full type scale rows.
	await expect(overlay.getByText("950", { exact: true }).first()).toBeVisible();
	await expect(overlay.getByText("4xl", { exact: true })).toBeVisible();
});

test("preview overlay paints above the sticky panel footer", async ({
	page,
}) => {
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: /^preview$/i }).click();

	const overlay = page.getByTestId("preview-overlay");
	await expect(overlay).toBeVisible();
	const box = await overlay.boundingBox();
	if (!box) {
		throw new Error("preview overlay has no bounding box");
	}
	// The sticky footers sit at the bottom edge of the workspace; the element
	// actually painted there must belong to the overlay, not the footer.
	const coveredByOverlay = await page.evaluate(
		([x, y]) => {
			const hit = document.elementFromPoint(x, y);
			return Boolean(hit?.closest('[data-testid="preview-overlay"]'));
		},
		[box.x + box.width / 2, box.y + box.height - 4],
	);
	expect(coveredByOverlay).toBe(true);
});
