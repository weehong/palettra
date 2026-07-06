import { expect, test } from "@playwright/test";

// Runs only in the `no-firebase-chromium` project against the server on
// port 3001, whose bundle was built with empty NEXT_PUBLIC_FIREBASE_* vars.

// D1
test("auth and collection controls are absent when Firebase is unconfigured", async ({
	page,
}) => {
	await page.goto("/generate/a543bc");

	await expect(page.getByRole("button", { name: "Random" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Preview" })).toBeVisible();
	await expect(
		page.getByRole("button", { name: /get the code/i }),
	).toBeVisible();

	await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Account" })).toHaveCount(0);
});

// D2
test("generator works without any Google API traffic", async ({ page }) => {
	// Font preview stylesheets (fonts.googleapis.com) are expected; any
	// Firebase endpoint is not.
	const googleRequests: Array<string> = [];
	page.on("request", (request) => {
		if (
			/identitytoolkit|securetoken|firestore\.googleapis|apis\.google\.com/.test(
				request.url(),
			)
		) {
			googleRequests.push(request.url());
		}
	});

	await page.goto("/generate/a543bc");
	await expect(page.getByTestId("swatch")).toHaveCount(11);

	await page.getByTestId("add-custom").click();
	await expect(page.getByTestId("swatch")).toHaveCount(22);

	expect(googleRequests).toEqual([]);
});
