import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { OAuthProviderId } from "@/lib/auth-providers";

const firebaseState = vi.hoisted(() => ({
	enabled: false,
	auth: { app: "auth" },
}));

const authState = vi.hoisted(() => ({
	callback: null as ((user: unknown) => void) | null,
	signInWithPopup: vi.fn(),
	signInWithRedirect: vi.fn(),
	signOut: vi.fn(),
	getRedirectResult: vi.fn<(...args: Array<unknown>) => Promise<null>>(() =>
		Promise.resolve(null),
	),
}));

vi.mock("client-only", () => ({}));
vi.mock("@/lib/firebase", () => ({
	isFirebaseEnabled: () => firebaseState.enabled,
	getFirebaseAuth: () => firebaseState.auth,
}));
vi.mock("@/lib/analytics", () => ({
	trackEvent: vi.fn(),
}));
vi.mock("firebase/auth", () => ({
	GoogleAuthProvider: class GoogleAuthProvider {},
	TwitterAuthProvider: class TwitterAuthProvider {},
	FacebookAuthProvider: class FacebookAuthProvider {},
	onAuthStateChanged: (
		_auth: unknown,
		callback: (user: unknown) => void,
	) => {
		authState.callback = callback;
		return vi.fn();
	},
	getRedirectResult: (...args: Array<unknown>) =>
		authState.getRedirectResult(...args),
	signInWithPopup: (...args: Array<unknown>) =>
		authState.signInWithPopup(...args),
	signInWithRedirect: (...args: Array<unknown>) =>
		authState.signInWithRedirect(...args),
	signOut: (...args: Array<unknown>) => authState.signOut(...args),
}));

async function renderAuth(children?: ReactNode) {
	vi.resetModules();
	const { AuthProvider, useAuth } = await import(
		"@/components/auth/auth-context"
	);

	function Probe() {
		const auth = useAuth();
		return (
			<div>
				<p data-testid="status">{auth.status}</p>
				<p data-testid="user">{auth.user?.displayName ?? "none"}</p>
				<p data-testid="error">{auth.error ?? "none"}</p>
				<button
					type="button"
					onClick={() => {
						// Mirror SignInDialog, which awaits and swallows the rejection
						// (the error text is surfaced via auth.error instead).
						void auth.signIn("google" as OAuthProviderId).catch(() => {});
					}}
				>
					Sign in with Google
				</button>
				{children}
			</div>
		);
	}

	return render(
		<AuthProvider>
			<Probe />
		</AuthProvider>,
	);
}

describe("AuthProvider", () => {
	beforeEach(() => {
		firebaseState.enabled = false;
		authState.callback = null;
		authState.signInWithPopup.mockReset();
		authState.signInWithRedirect.mockReset();
		authState.signOut.mockReset();
		authState.getRedirectResult.mockReset();
		authState.getRedirectResult.mockResolvedValue(null);
	});

	it("reports disabled state when Firebase is not configured", async () => {
		await renderAuth();

		expect(screen.getByTestId("status")).toHaveTextContent("disabled");
		expect(authState.callback).toBeNull();
	});

	it("updates between signed-out and signed-in auth states", async () => {
		firebaseState.enabled = true;
		await renderAuth();

		authState.callback?.(null);
		await waitFor(() =>
			expect(screen.getByTestId("status")).toHaveTextContent("signed-out"),
		);

		authState.callback?.({ displayName: "Ada Lovelace" });
		await waitFor(() =>
			expect(screen.getByTestId("status")).toHaveTextContent("signed-in"),
		);
		expect(screen.getByTestId("user")).toHaveTextContent("Ada Lovelace");
	});

	it("falls back to redirect when the popup is blocked", async () => {
		firebaseState.enabled = true;
		authState.signInWithPopup.mockRejectedValueOnce({
			code: "auth/popup-blocked",
		});
		authState.signInWithRedirect.mockResolvedValueOnce(undefined);
		await renderAuth();

		fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

		await waitFor(() => {
			expect(authState.signInWithRedirect).toHaveBeenCalledTimes(1);
		});
	});

	it("surfaces a generic error for a non-fallback popup failure", async () => {
		firebaseState.enabled = true;
		authState.signInWithPopup.mockRejectedValueOnce({
			code: "auth/popup-closed-by-user",
		});
		await renderAuth();

		fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

		await waitFor(() => {
			expect(screen.getByTestId("error")).toHaveTextContent(
				"Sign in failed. Try again or use another provider.",
			);
		});
		expect(authState.signInWithRedirect).not.toHaveBeenCalled();
	});

	it("maps the account-exists error to provider-specific guidance", async () => {
		firebaseState.enabled = true;
		authState.signInWithPopup.mockRejectedValueOnce({
			code: "auth/account-exists-with-different-credential",
		});
		await renderAuth();

		fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

		await waitFor(() => {
			expect(screen.getByTestId("error")).toHaveTextContent(
				"An account already exists for this email.",
			);
		});
	});
});
