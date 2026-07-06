import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const authState = vi.hoisted(() => ({
	status: "disabled",
	user: null as {
		uid: string;
		displayName: string | null;
		email: string | null;
		photoURL: string | null;
	} | null,
	error: null,
	signIn: vi.fn(),
	signOut: vi.fn(),
	clearError: vi.fn(),
}));

const accountState = vi.hoisted(() => ({
	deleteAccount: vi.fn(),
}));

const routerPush = vi.hoisted(() => vi.fn());

vi.mock("client-only", () => ({}));
vi.mock("@/components/auth/auth-context", () => ({
	useAuth: () => authState,
}));
vi.mock("@/lib/account", () => ({
	AccountDeletionError: class AccountDeletionError extends Error {
		stage: string;
		code?: string;

		constructor(stage: string, code?: string) {
			super("Account deletion failed");
			this.stage = stage;
			this.code = code;
		}
	},
	deleteAccount: (...args: Array<unknown>) =>
		accountState.deleteAccount(...args),
}));
vi.mock("@/lib/analytics", () => ({
	trackEvent: vi.fn(),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: routerPush }),
}));

async function renderSettings() {
	const { AccountSettings } = await import(
		"@/components/settings/account-settings"
	);
	return render(<AccountSettings />);
}

function signInUser(): void {
	authState.status = "signed-in";
	authState.user = {
		uid: "user-1",
		displayName: "Test User",
		email: "test@example.com",
		photoURL: null,
	};
}

async function openDeleteDialog(): Promise<void> {
	await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
	expect(
		await screen.findByRole("dialog", { name: "Delete account" }),
	).toBeInTheDocument();
}

describe("settings page", () => {
	beforeEach(() => {
		authState.status = "disabled";
		authState.user = null;
		authState.error = null;
		authState.signIn.mockReset();
		authState.signOut.mockReset();
		authState.clearError.mockReset();
		accountState.deleteAccount.mockReset();
		accountState.deleteAccount.mockResolvedValue(undefined);
		routerPush.mockReset();
	});

	it("exports noindex metadata and renders the account settings section", async () => {
		const { default: SettingsPage, metadata } = await import(
			"@/app/settings/page"
		);

		render(<SettingsPage />);

		expect(metadata).toMatchObject({
			title: "Settings",
			robots: { index: false, follow: false },
		});
		expect(
			screen.getByText("Accounts are not enabled on this deployment."),
		).toBeInTheDocument();
	});

	it("renders disabled, signed-out, and signed-in states", async () => {
		const { AccountSettings } = await import(
			"@/components/settings/account-settings"
		);
		const { rerender } = render(<AccountSettings />);
		expect(
			screen.getByText("Accounts are not enabled on this deployment."),
		).toBeInTheDocument();

		authState.status = "signed-out";
		rerender(<AccountSettings />);
		expect(
			screen.getByText("Sign in to manage your account."),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();

		signInUser();
		rerender(<AccountSettings />);
		expect(screen.getByText("Test User")).toBeInTheDocument();
		expect(screen.getByText("test@example.com")).toBeInTheDocument();
		expect(
			screen.getByText(/deletes your account and all saved palettes/i),
		).toBeInTheDocument();
	});

	it("opens the existing sign-in dialog for signed-out users", async () => {
		authState.status = "signed-out";
		await renderSettings();

		await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

		expect(
			await screen.findByRole("dialog", { name: "Sign in" }),
		).toBeInTheDocument();
	});

	it("requires typing DELETE before account deletion can be confirmed", async () => {
		signInUser();
		await renderSettings();
		await openDeleteDialog();

		const confirm = screen.getByRole("button", { name: "Permanently delete account" });
		expect(confirm).toBeDisabled();
		expect(screen.getByText(/Type DELETE to continue/)).toBeInTheDocument();

		await userEvent.type(screen.getByLabelText("Confirmation"), "DELETE");

		expect(confirm).toBeEnabled();
	});

	it("disables dialog actions and blocks closing while deletion is pending", async () => {
		signInUser();
		accountState.deleteAccount.mockReturnValueOnce(new Promise(() => {}));
		await renderSettings();
		await openDeleteDialog();
		await userEvent.type(screen.getByLabelText("Confirmation"), "DELETE");

		await userEvent.click(
			screen.getByRole("button", { name: "Permanently delete account" }),
		);
		fireEvent.keyDown(document, { key: "Escape" });

		expect(screen.getByRole("dialog", { name: "Delete account" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Deleting account" }),
		).toHaveAttribute("aria-busy", "true");
	});

	it("closes the dialog and returns home after successful deletion", async () => {
		signInUser();
		await renderSettings();
		await openDeleteDialog();
		await userEvent.type(screen.getByLabelText("Confirmation"), "DELETE");

		await userEvent.click(
			screen.getByRole("button", { name: "Permanently delete account" }),
		);

		await waitFor(() => expect(accountState.deleteAccount).toHaveBeenCalledTimes(1));
		expect(routerPush).toHaveBeenCalledWith("/");
		expect(
			screen.queryByRole("dialog", { name: "Delete account" }),
		).not.toBeInTheDocument();
	});

	it("returns to idle silently when reauthentication is cancelled", async () => {
		signInUser();
		const { AccountDeletionError } = await import("@/lib/account");
		accountState.deleteAccount.mockRejectedValueOnce(
			new AccountDeletionError("reauth", "auth/popup-closed-by-user"),
		);
		await renderSettings();
		await openDeleteDialog();
		await userEvent.type(screen.getByLabelText("Confirmation"), "DELETE");

		await userEvent.click(
			screen.getByRole("button", { name: "Permanently delete account" }),
		);

		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Permanently delete account" }),
			).toBeEnabled(),
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("keeps the dialog open with partial-deletion guidance after auth delete fails", async () => {
		signInUser();
		const { AccountDeletionError } = await import("@/lib/account");
		accountState.deleteAccount.mockRejectedValueOnce(
			new AccountDeletionError("auth-delete", "auth/internal-error"),
		);
		await renderSettings();
		await openDeleteDialog();
		await userEvent.type(screen.getByLabelText("Confirmation"), "DELETE");

		await userEvent.click(
			screen.getByRole("button", { name: "Permanently delete account" }),
		);

		expect(
			await screen.findByRole("alert"),
		).toHaveTextContent(
			"Some or all of your saved palettes were deleted, but the account could not be fully removed. Try again to finish.",
		);
		expect(screen.getByRole("dialog", { name: "Delete account" })).toBeInTheDocument();
	});
});
