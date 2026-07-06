import { expect, test } from "@playwright/test";

test("home page renders the palette generator", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { level: 1, name: "Palettra" }),
	).toBeVisible();
	await expect(page.getByTestId("swatch")).toHaveCount(11);
});

test("generator routes fit in one viewport without parent page scrolling", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 720 });

	for (const path of ["/", "/generate/a543bc"]) {
		await page.goto(path);
		await expect(page.getByTestId("generator-workspace")).toBeVisible();
		await expect
			.poll(() =>
				page.evaluate(
					() =>
						document.scrollingElement?.scrollHeight ??
						document.body.scrollHeight,
				),
			)
			.toBeLessThanOrEqual(720);
	}
});

test("seeded /generate/[hex] shows the base color and syncs the URL", async ({
	page,
}) => {
	await page.goto("/generate/a543bc");
	await expect(page.getByText("#a543bc", { exact: true })).toBeVisible();
	await expect(page.getByText("Base", { exact: true })).toBeVisible();

	const lightness = page.getByLabel("Lightness").first();
	await lightness.focus();
	await lightness.press("ArrowLeft");
	await expect.poll(() => page.url()).not.toContain("a543bc");
	await expect.poll(() => page.url()).toContain("/generate/");
});

test("adds a secondary color role", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await expect(page.getByTestId("swatch")).toHaveCount(11);

	await page.getByTestId("add-custom").click();
	await expect(page.getByTestId("swatch")).toHaveCount(22);
});

test("adds the status scales", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await page.getByRole("tab", { name: "Status" }).click();
	await page.getByRole("button", { name: /add status/i }).click();

	// Success, warning, and error scales all render in the Status tab.
	await expect(page.getByTestId("swatch")).toHaveCount(33);
});

// R2 — the Random button re-rolls the primary color and updates the URL.
test("Random re-rolls the primary color", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: "Random" }).click();
	await expect.poll(() => page.url()).not.toContain("a543bc");
	await expect.poll(() => page.url()).toContain("/generate/");
});

// R3 — Spacebar randomizes the primary color, but not while typing.
test("Spacebar randomizes the primary color outside of inputs", async ({
	page,
}) => {
	await page.goto("/generate/a543bc");
	await page.locator("body").press("Space");
	await expect.poll(() => page.url()).not.toContain("a543bc");
});

test("Spacebar in a text input does not randomize", async ({ page }) => {
	await page.goto("/generate/a543bc");
	const beforeUrl = page.url();

	const hexInput = page.getByLabel("Primary hex");
	await hexInput.focus();
	await hexInput.press("Space");
	// A brief settle window; the URL sync is synchronous on change.
	await page.waitForTimeout(300);
	expect(page.url()).toBe(beforeUrl);
});

// R1 — clicking a swatch copies its hex and flips the label to a
// confirmation. (The clipboard contents themselves aren't asserted: the
// async Clipboard API is unreliable in headless browsers, and the label
// flip is the user-visible proof the copy handler ran.)
test("clicking a swatch copies its hex", async ({ page }) => {
	await page.goto("/generate/a543bc");

	const swatch = page.getByTitle("Copy #a543bc");
	await swatch.click();
	await expect(swatch).toContainText("Copied!");
});

// R4 — a multi-role palette round-trips through the shareable URL.
test("rehydrates added roles from the URL", async ({ page }) => {
	await page.goto("/generate/a543bc");
	await page.getByTestId("add-custom").click();
	await expect(page.getByTestId("swatch")).toHaveCount(22);
	await expect.poll(() => page.url()).toContain("colors=");

	await page.goto(page.url());
	await expect(page.getByTestId("swatch")).toHaveCount(22);
});

// R8 — the app renders under the dark color scheme (media-driven, no toggle).
test("renders under the dark color scheme", async ({ browser }) => {
	const context = await browser.newContext({ colorScheme: "dark" });
	const page = await context.newPage();
	await page.goto("/generate/a543bc");
	await expect(page.getByTestId("generator-workspace")).toBeVisible();
	await expect(page.getByTestId("swatch")).toHaveCount(11);
	await context.close();
});
