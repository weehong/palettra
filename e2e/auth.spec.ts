import { expect, seedSignedInUser, test } from "./fixtures/auth";
import { FirestoreFake } from "./fixtures/firestore-mock";
import { stubPopupAutoClose } from "./fixtures/popup-auth";

// A1 — Save is a signed-in-only control; signed-out visitors get Sign in.
test("signed-out visitors see Sign in but no Save control", async ({
	page,
}) => {
	await page.goto("/generate/a543bc");
	await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
});

// A2
test("sign-in dialog opens and closes via ✕, backdrop, and Escape", async ({
	page,
}) => {
	await page.goto("/generate/a543bc");
	const signIn = page.getByRole("button", { name: "Sign in" });
	const dialog = page.getByRole("dialog");

	await signIn.click();
	await expect(dialog.getByRole("heading", { name: "Sign in" })).toBeVisible();
	for (const provider of ["Google", "Twitter", "Facebook"]) {
		await expect(
			dialog.getByRole("button", { name: `Continue with ${provider}` }),
		).toBeEnabled();
	}

	await dialog.getByRole("button", { name: "Close" }).click();
	await expect(dialog).toBeHidden();

	await signIn.click();
	await expect(dialog).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();

	await signIn.click();
	await expect(dialog).toBeVisible();
	// A click outside the dialog box lands on the backdrop (the dialog
	// element itself), which the component treats as dismissal.
	await page.mouse.click(5, 5);
	await expect(dialog).toBeHidden();
});

// A3 — Save appears with sign-in, and browsing signed-out produces no
// Firestore traffic at all.
test("Save appears only after sign-in; signed-out browsing stays offline", async ({
	context,
	page,
}) => {
	const firestore = new FirestoreFake();
	await firestore.install(context);

	await page.goto("/generate/a543bc");
	await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
	expect(firestore.messageLog).toHaveLength(0);

	await seedSignedInUser(page);
	await page.goto("/generate/a543bc");
	await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
});

// A4 — fixture canary. If a firebase SDK upgrade changes the IndexedDB
// persistence schema, this test fails first: suspect e2e/fixtures/auth.ts,
// not the app.
test("seeded sign-in shows the account menu (fixture canary)", async ({
	page,
}) => {
	await seedSignedInUser(page);
	await page.goto("/generate/a543bc");

	const account = page.getByRole("button", { name: "Account" });
	await expect(account).toBeVisible();
	await expect(account).toContainText("ET");

	await account.click();
	await expect(
		page.getByRole("menuitem", { name: "My palettes" }),
	).toBeVisible();
	await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
});

// A5
test("sign-out returns to the signed-out state and survives reload", async ({
	page,
}) => {
	await seedSignedInUser(page);
	await page.goto("/generate/a543bc");

	await page.getByRole("button", { name: "Account" }).click();
	await page.getByRole("menuitem", { name: "Sign out" }).click();
	await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

	await page.reload();
	await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Account" })).toHaveCount(0);
});

// A6 — clicking a provider wires through to the real signIn(), which kicks
// off signInWithPopup and loads Google's gapi client. Observing that request
// proves the end-to-end click path. The full popup handshake (and thus the
// error banner) can't be reproduced deterministically cross-browser without
// faking gapi's iframe machinery, so the error-message mapping and banner
// render are covered by unit tests (auth-context / sign-in-dialog).
test("clicking a provider initiates the sign-in flow", async ({
	context,
	page,
}) => {
	await stubPopupAutoClose(context);

	await page.goto("/generate/a543bc");
	await page.getByRole("button", { name: "Sign in" }).click();

	const dialog = page.getByRole("dialog");
	const gapiRequest = page.waitForRequest(/apis\.google\.com/, {
		timeout: 15_000,
	});
	await dialog.getByRole("button", { name: "Continue with Google" }).click();
	await gapiRequest;
});
