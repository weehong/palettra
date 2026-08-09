import { expect, test } from "@playwright/test";

// Every test here stubs POST /api/feedback. A suite that can put real mail in
// the operator's mailbox on each run is a bug, not a test.
async function stubFeedbackEndpoint(
	page: import("@playwright/test").Page,
	status: number,
	body: unknown,
): Promise<void> {
	await page.route("**/api/feedback", (route) =>
		route.fulfill({
			status,
			contentType: "application/json",
			body: JSON.stringify(body),
		}),
	);
}

test("a visitor can send feedback and sees it confirmed in place", async ({
	page,
}) => {
	await stubFeedbackEndpoint(page, 200, { ok: true });
	await page.goto("/");

	await page.getByRole("button", { name: "Feedback" }).click();

	const dialog = page.getByRole("dialog");
	await expect(
		dialog.getByRole("heading", { name: "Send feedback" }),
	).toBeVisible();

	await dialog
		.getByLabel("Message")
		.fill("A Sass variables export next to the CSS one would save me a step.");
	await dialog.getByLabel(/^Email/).fill("someone@example.com");

	const [submission] = await Promise.all([
		page.waitForRequest("**/api/feedback"),
		dialog.getByRole("button", { name: "Send" }).click(),
	]);

	expect(submission.postDataJSON()).toMatchObject({
		type: "general",
		email: "someone@example.com",
		website: "",
	});
	await expect(dialog.getByText("Thanks — got it.")).toBeVisible();
	await expect(dialog.getByLabel("Message")).toHaveCount(0);
});

test("the selected type travels with the submission", async ({ page }) => {
	await stubFeedbackEndpoint(page, 200, { ok: true });
	await page.goto("/");

	await page.getByRole("button", { name: "Feedback" }).click();
	const dialog = page.getByRole("dialog");

	await dialog.getByRole("combobox").click();
	await page.getByRole("option", { name: "Bug report" }).click();
	await dialog
		.getByLabel("Message")
		.fill("Swatch labels overlap on a 320px viewport.");

	const [submission] = await Promise.all([
		page.waitForRequest("**/api/feedback"),
		dialog.getByRole("button", { name: "Send" }).click(),
	]);

	expect(submission.postDataJSON()).toMatchObject({ type: "bug" });
});

test("a failed send keeps the message so it can be retried", async ({
	page,
}) => {
	await stubFeedbackEndpoint(page, 502, {
		error: "Could not send your message. Please try again.",
	});
	await page.goto("/");

	await page.getByRole("button", { name: "Feedback" }).click();
	const dialog = page.getByRole("dialog");

	const message = "The Figma token export drops the neutral ramp.";
	await dialog.getByLabel("Message").fill(message);
	await dialog.getByRole("button", { name: "Send" }).click();

	await expect(dialog.getByRole("alert")).toContainText("Could not send");
	await expect(dialog.getByLabel("Message")).toHaveValue(message);
	await expect(dialog.getByText("Thanks — got it.")).toHaveCount(0);
});
