import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { siteConfig } from "@/lib/site-config";

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

const trackEvent = vi.hoisted(() => vi.fn());
const routerPush = vi.hoisted(() => vi.fn());

vi.mock("@/components/auth/auth-context", () => ({
	useAuth: () => authState,
}));
vi.mock("@/lib/firebase", () => ({
	getFirebaseDb: () => null,
}));
vi.mock("@/lib/analytics", () => ({
	trackEvent,
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: routerPush }),
}));

function renderWithQuery(children: ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
	);
}

describe("Navbar", () => {
	beforeEach(() => {
		authState.status = "disabled";
		authState.user = null;
		trackEvent.mockReset();
		routerPush.mockReset();
	});

	it("renders the brand link even when auth is disabled", async () => {
		const { Navbar } = await import("@/components/layout/navbar");

		renderWithQuery(<Navbar />);

		const brand = screen.getByRole("link", { name: siteConfig.name });
		expect(brand).toHaveAttribute("href", "/");
		expect(
			screen.getByRole("heading", { level: 1, name: siteConfig.headline }),
		).toHaveClass("text-4xl", "font-normal", "tracking-normal");
		expect(
			screen.queryByRole("button", { name: "Sign in" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Account" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Terms" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: "Privacy" }),
		).not.toBeInTheDocument();
	});

	it("shows a sign-in button that opens the sign-in dialog when signed out", async () => {
		authState.status = "signed-out";
		const { Navbar } = await import("@/components/layout/navbar");

		renderWithQuery(<Navbar />);
		fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

		// Radix dialog content is portaled and only rendered while open.
		expect(
			await screen.findByRole("dialog", { name: "Sign in" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Continue with Google" }),
		).toBeInTheDocument();
	});

	it("shows the account menu and opens the collection for signed-in users", async () => {
		authState.status = "signed-in";
		authState.user = {
			uid: "user-1",
			displayName: "Test User",
			email: "test@example.com",
			photoURL: null,
		};
		const { Navbar } = await import("@/components/layout/navbar");

		renderWithQuery(<Navbar />);
		// Radix menus open on pointer events, which fireEvent.click does not emit.
		await userEvent.click(screen.getByRole("button", { name: /account/i }));
		await userEvent.click(
			screen.getByRole("menuitem", { name: "My palettes" }),
		);

		expect(
			await screen.findByRole("dialog", { name: "My palettes" }),
		).toBeInTheDocument();
		expect(trackEvent).toHaveBeenCalledWith("collection_opened");
	});

	it("shows a circular spinner while sign-out is pending", async () => {
		authState.status = "signed-in";
		authState.user = {
			uid: "user-1",
			displayName: "Test User",
			email: "test@example.com",
			photoURL: null,
		};
		authState.signOut.mockReturnValueOnce(new Promise(() => {}));
		const { Navbar } = await import("@/components/layout/navbar");

		renderWithQuery(<Navbar />);
		await userEvent.click(screen.getByRole("button", { name: /account/i }));
		await userEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));

		expect(
			await screen.findByRole("status", { name: "Signing out" }),
		).toHaveClass("animate-spin");
		expect(
			screen.getByRole("menuitem", { name: "Signing out" }),
		).toHaveAttribute("aria-busy", "true");
	});

	it("shows a settings item for signed-in users", async () => {
		authState.status = "signed-in";
		authState.user = {
			uid: "user-1",
			displayName: "Test User",
			email: "test@example.com",
			photoURL: null,
		};
		const { Navbar } = await import("@/components/layout/navbar");

		renderWithQuery(<Navbar />);
		await userEvent.click(screen.getByRole("button", { name: /account/i }));
		await userEvent.click(screen.getByRole("menuitem", { name: "Settings" }));

		expect(routerPush).toHaveBeenCalledWith("/settings");
	});

	it("keeps legal links out of the signed-in account menu", async () => {
		authState.status = "signed-in";
		authState.user = {
			uid: "user-1",
			displayName: "Test User",
			email: "test@example.com",
			photoURL: null,
		};
		const { Navbar } = await import("@/components/layout/navbar");

		renderWithQuery(<Navbar />);
		await userEvent.click(screen.getByRole("button", { name: /account/i }));
		expect(
			screen.queryByRole("menuitem", { name: "Terms" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("menuitem", { name: "Privacy" }),
		).not.toBeInTheDocument();
	});
});
