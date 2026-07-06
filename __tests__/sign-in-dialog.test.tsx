import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const signIn = vi.fn();
const authValue = {
	signIn,
	status: "signed-out",
	error: null as string | null,
	clearError: vi.fn(),
};

vi.mock("@/components/auth/auth-context", () => ({
	useAuth: () => authValue,
}));

describe("SignInDialog", () => {
	beforeEach(() => {
		signIn.mockReset();
		authValue.error = null;
	});

	it("renders all OAuth provider actions", async () => {
		const { SignInDialog } = await import("@/components/auth/sign-in-dialog");

		render(<SignInDialog open onOpenChange={() => {}} />);

		expect(
			screen.getByRole("button", { name: "Continue with Google" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Continue with Twitter" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Continue with Facebook" }),
		).toBeInTheDocument();
	});

	it("calls signIn with the selected provider", async () => {
		signIn.mockResolvedValueOnce(undefined);
		const { SignInDialog } = await import("@/components/auth/sign-in-dialog");

		render(<SignInDialog open onOpenChange={() => {}} />);
		fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

		await waitFor(() => {
			expect(signIn).toHaveBeenCalledWith("google");
		});
	});

	it("shows a circular spinner while the provider sign-in is pending", async () => {
		signIn.mockReturnValueOnce(new Promise(() => {}));
		const { SignInDialog } = await import("@/components/auth/sign-in-dialog");

		render(<SignInDialog open onOpenChange={() => {}} />);
		fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

		expect(
			await screen.findByRole("status", { name: "Signing in with Google" }),
		).toHaveClass("animate-spin");
		expect(
			screen.getByRole("button", { name: "Signing in with Google" }),
		).toHaveAttribute("aria-busy", "true");
		expect(screen.queryByText("Opening...")).not.toBeInTheDocument();
	});

	it("shows the error banner when auth reports an error", async () => {
		authValue.error = "Sign in failed. Try again or use another provider.";
		const { SignInDialog } = await import("@/components/auth/sign-in-dialog");

		render(<SignInDialog open onOpenChange={() => {}} />);

		expect(
			screen.getByText("Sign in failed. Try again or use another provider."),
		).toBeInTheDocument();
	});
});
