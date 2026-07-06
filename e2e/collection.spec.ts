import type { Page } from "@playwright/test";

import { expect, seedSignedInUser, test } from "./fixtures/auth";
import { FirestoreFake } from "./fixtures/firestore-mock";

function role(id: string, name: string, hex: string) {
	return { id, name, hex, auto: false };
}

async function signIn(page: Page): Promise<void> {
	await seedSignedInUser(page);
	await page.goto("/generate/a543bc");
	// Wait for auth restoration; interacting while status is still
	// "loading" routes Save to the sign-in dialog instead of the mutation.
	await expect(page.getByRole("button", { name: "Account" })).toBeVisible();
}

async function openCollection(page: Page): Promise<void> {
	await page.getByRole("button", { name: "Account" }).click();
	await page.getByRole("menuitem", { name: "My palettes" }).click();
	await expect(
		page.getByRole("dialog").getByRole("heading", { name: "My palettes" }),
	).toBeVisible();
}

// C1 — the Firestore WebChannel spike gate: signed-in Save must round-trip
// through the mocked Write stream.
test("saves the current palette to the collection", async ({
	context,
	page,
}) => {
	const firestore = new FirestoreFake();
	await firestore.install(context);
	await signIn(page);

	await page.getByRole("button", { name: "Save" }).click();
	await expect(page.getByRole("button", { name: "Saved ✓" })).toBeVisible();
	// The button label reverts after ~1.5s.
	await expect(page.getByRole("button", { name: "Save" })).toBeVisible();

	expect(firestore.palettes).toHaveLength(1);
	const saved = firestore.palettes[0];
	expect(saved.name).toContain("#a543bc");
	expect(String(saved.href)).toMatch(/^\/generate\/[0-9a-fA-F]{3,8}/);
	expect(saved.roles).toHaveLength(1);
	expect(saved.updatedAt).toBeTruthy();
});

// C2
test("collection dialog shows the empty state", async ({ context, page }) => {
	const firestore = new FirestoreFake();
	await firestore.install(context);
	await signIn(page);

	await openCollection(page);
	await expect(page.getByText("No saved palettes yet.")).toBeVisible();
});

// C3
test("lists saved palettes with their actions", async ({ context, page }) => {
	const firestore = new FirestoreFake();
	firestore.seedPalette({
		id: "p1",
		name: "Ocean palette",
		roles: [role("primary", "Primary", "#3366ff")],
		href: "/generate/3366ff",
	});
	firestore.seedPalette({
		id: "p2",
		name: "Sunset palette",
		roles: [role("primary", "Primary", "#ff6633")],
		href: "/generate/ff6633",
	});
	await firestore.install(context);
	await signIn(page);

	await openCollection(page);
	for (const name of ["Ocean palette", "Sunset palette"]) {
		const item = page.getByRole("listitem").filter({ hasText: name });
		await expect(item.getByText(/Updated .+ ago/)).toBeVisible();
		await expect(item.getByRole("button", { name: `Open ${name}` })).toBeVisible();
		await expect(item.getByRole("button", { name: "Rename" })).toBeVisible();
		await expect(item.getByRole("button", { name: "Delete" })).toBeVisible();
	}
});

// C4
test("opens a saved palette by its href", async ({ context, page }) => {
	const firestore = new FirestoreFake();
	firestore.seedPalette({
		id: "p1",
		name: "Ocean palette",
		roles: [role("primary", "Primary", "#3366ff")],
		href: "/generate/3366ff",
	});
	await firestore.install(context);
	await signIn(page);

	await openCollection(page);
	await page.getByRole("button", { name: "Open Ocean palette" }).click();

	await expect.poll(() => page.url()).toContain("/generate/3366ff");
	await expect(page.getByRole("dialog")).toBeHidden();
	await expect(page.getByTestId("swatch")).toHaveCount(11);
});

// C5 — a tampered href must not escape /generate/.
test("falls back to a rebuilt href when the stored one is unsafe", async ({
	context,
	page,
}) => {
	const firestore = new FirestoreFake();
	firestore.seedPalette({
		id: "p1",
		name: "Tampered palette",
		roles: [role("primary", "Primary", "#22aa44")],
		href: "https://evil.example/phishing",
	});
	await firestore.install(context);
	await signIn(page);

	await openCollection(page);
	await page.getByRole("button", { name: "Open Tampered palette" }).click();

	await expect.poll(() => page.url()).toContain("/generate/22aa44");
	await expect(page.getByTestId("swatch")).toHaveCount(11);
});

// C6
test("renames a saved palette", async ({ context, page }) => {
	const firestore = new FirestoreFake();
	firestore.seedPalette({
		id: "p1",
		name: "Ocean palette",
		roles: [role("primary", "Primary", "#3366ff")],
		href: "/generate/3366ff",
	});
	await firestore.install(context);
	await signIn(page);

	await openCollection(page);
	const dialog = page.getByRole("dialog");
	await dialog.getByRole("button", { name: "Rename" }).click();

	const input = dialog.getByRole("textbox");
	await expect(input).toHaveValue("Ocean palette");
	await input.fill("  Renamed palette  ");
	await dialog.getByRole("button", { name: "Save" }).click();

	await expect(
		dialog.getByRole("heading", { name: "Renamed palette" }),
	).toBeVisible();
	expect(firestore.palettes[0].name).toBe("Renamed palette");
});

// C7
test("deletes a palette after confirmation", async ({ context, page }) => {
	const firestore = new FirestoreFake();
	firestore.seedPalette({
		id: "p1",
		name: "Ocean palette",
		roles: [role("primary", "Primary", "#3366ff")],
		href: "/generate/3366ff",
	});
	await firestore.install(context);
	await signIn(page);

	await openCollection(page);
	page.once("dialog", (confirm) => {
		expect(confirm.message()).toBe("Delete this palette?");
		void confirm.accept();
	});
	await page.getByRole("button", { name: "Delete" }).click();

	await expect(page.getByText("No saved palettes yet.")).toBeVisible();
	expect(firestore.palettes).toHaveLength(0);
});

test("keeps the palette when deletion is dismissed", async ({
	context,
	page,
}) => {
	const firestore = new FirestoreFake();
	firestore.seedPalette({
		id: "p1",
		name: "Ocean palette",
		roles: [role("primary", "Primary", "#3366ff")],
		href: "/generate/3366ff",
	});
	await firestore.install(context);
	await signIn(page);

	await openCollection(page);
	page.once("dialog", (confirm) => void confirm.dismiss());
	await page.getByRole("button", { name: "Delete" }).click();

	await expect(
		page.getByRole("heading", { name: "Ocean palette" }),
	).toBeVisible();
	expect(firestore.palettes).toHaveLength(1);
});
