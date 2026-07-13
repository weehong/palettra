import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { defaultTheme } from "@/lib/theme";
import { defaultTypography } from "@/lib/typography";

const authState = vi.hoisted(() => ({
	status: "disabled",
	user: null as { uid: string } | null,
}));

const collectionState = vi.hoisted(() => ({
	savePalette: vi.fn(),
	updatePalette: vi.fn(),
	listPalettes: vi.fn(),
	deletePalette: vi.fn(),
	renamePalette: vi.fn(),
}));

const toastState = vi.hoisted(() => ({
	success: vi.fn(),
	error: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: toastState,
}));

vi.mock("@/components/auth/auth-context", () => ({
	useAuth: () => authState,
}));
vi.mock("@/lib/firebase", () => ({
	getFirebaseDb: () => ({ app: "db" }),
}));
vi.mock("@/lib/analytics", () => ({
	trackEvent: vi.fn(),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/palette-collection", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@/lib/palette-collection")>();
	return {
		...actual,
		savePalette: (...args: Array<unknown>) =>
			collectionState.savePalette(...args),
		updatePalette: (...args: Array<unknown>) =>
			collectionState.updatePalette(...args),
		listPalettes: (...args: Array<unknown>) =>
			collectionState.listPalettes(...args),
		deletePalette: (...args: Array<unknown>) =>
			collectionState.deletePalette(...args),
		renamePalette: (...args: Array<unknown>) =>
			collectionState.renamePalette(...args),
	};
});

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

describe("palette collection UI", () => {
	beforeEach(() => {
		authState.status = "disabled";
		authState.user = null;
		collectionState.savePalette.mockReset();
		collectionState.updatePalette.mockReset();
		collectionState.listPalettes.mockReset();
		collectionState.deletePalette.mockReset();
		collectionState.renamePalette.mockReset();
		toastState.success.mockReset();
		toastState.error.mockReset();
	});

	it("hides the save button when Firebase auth is disabled", async () => {
		const { SavePaletteButton } =
			await import("@/components/collection/save-palette-button");

		renderWithQuery(
			<SavePaletteButton
				theme={defaultTheme("#a543bc")}
				typography={defaultTypography()}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Save" }),
		).not.toBeInTheDocument();
	});

	it("hides the save button for signed-out users", async () => {
		authState.status = "signed-out";
		const { SavePaletteButton } =
			await import("@/components/collection/save-palette-button");

		renderWithQuery(
			<SavePaletteButton
				theme={defaultTheme("#a543bc")}
				typography={defaultTypography()}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Save" }),
		).not.toBeInTheDocument();
	});

	it("saves the current palette for signed-in users", async () => {
		authState.status = "signed-in";
		authState.user = { uid: "user-1" };
		let resolveSave: (value: string) => void = () => {};
		collectionState.savePalette.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveSave = resolve;
			}),
		);
		const { SavePaletteButton } =
			await import("@/components/collection/save-palette-button");

		renderWithQuery(
			<SavePaletteButton
				theme={defaultTheme("#a543bc")}
				typography={defaultTypography()}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		const nameInput = await screen.findByLabelText("Palette name");
		expect((nameInput as HTMLInputElement).value).not.toBe("");
		fireEvent.change(nameInput, { target: { value: "My brand palette" } });
		fireEvent.click(screen.getByRole("button", { name: "Save palette" }));

		expect(
			await screen.findByRole("status", { name: "Saving palette" }),
		).toHaveClass("animate-spin");
		resolveSave("palette-1");

		await waitFor(() => {
			expect(collectionState.savePalette).toHaveBeenCalledTimes(1);
		});
		expect(collectionState.savePalette).toHaveBeenCalledWith(
			expect.anything(),
			"user-1",
			expect.objectContaining({ name: "My brand palette" }),
		);
		await waitFor(() => {
			expect(toastState.success).toHaveBeenCalledWith("Palette saved");
		});
		expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
	});

	it("shows an error snackbar when saving fails", async () => {
		authState.status = "signed-in";
		authState.user = { uid: "user-1" };
		collectionState.savePalette.mockRejectedValueOnce(new Error("offline"));
		const { SavePaletteButton } =
			await import("@/components/collection/save-palette-button");

		renderWithQuery(
			<SavePaletteButton
				theme={defaultTheme("#a543bc")}
				typography={defaultTypography()}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		fireEvent.click(
			await screen.findByRole("button", { name: "Save palette" }),
		);

		await waitFor(() => {
			expect(toastState.error).toHaveBeenCalledWith(
				"Couldn't save palette — try again",
			);
		});
		expect(toastState.success).not.toHaveBeenCalled();
	});

	it("offers to overwrite an opened saved palette", async () => {
		authState.status = "signed-in";
		authState.user = { uid: "user-1" };
		collectionState.updatePalette.mockResolvedValueOnce(undefined);
		const { SavePaletteButton } =
			await import("@/components/collection/save-palette-button");

		renderWithQuery(
			<SavePaletteButton
				theme={defaultTheme("#a543bc")}
				typography={defaultTypography()}
				existingPalette={{ id: "palette-1", name: "Brand palette" }}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(
			await screen.findByRole("heading", { name: "Save existing palette?" }),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Overwrite" }));

		await waitFor(() => {
			expect(collectionState.updatePalette).toHaveBeenCalledWith(
				expect.anything(),
				"user-1",
				"palette-1",
				expect.objectContaining({ name: "Brand palette" }),
			);
		});
		expect(collectionState.savePalette).not.toHaveBeenCalled();
	});

	it("creates a named copy of an opened saved palette", async () => {
		authState.status = "signed-in";
		authState.user = { uid: "user-1" };
		collectionState.savePalette.mockResolvedValueOnce("palette-2");
		const onSaved = vi.fn();
		const { SavePaletteButton } =
			await import("@/components/collection/save-palette-button");

		renderWithQuery(
			<SavePaletteButton
				theme={defaultTheme("#a543bc")}
				typography={defaultTypography()}
				existingPalette={{ id: "palette-1", name: "Brand palette" }}
				onSaved={onSaved}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		fireEvent.click(await screen.findByRole("button", { name: "Create new" }));
		const nameInput = screen.getByLabelText("Palette name");
		expect(nameInput).toHaveValue("Brand palette copy");
		fireEvent.change(nameInput, { target: { value: "Brand variation" } });
		fireEvent.click(screen.getByRole("button", { name: "Save palette" }));

		await waitFor(() => {
			expect(collectionState.savePalette).toHaveBeenCalledWith(
				expect.anything(),
				"user-1",
				expect.objectContaining({ name: "Brand variation" }),
			);
		});
		expect(onSaved).toHaveBeenCalledWith({
			id: "palette-2",
			name: "Brand variation",
		});
		expect(collectionState.updatePalette).not.toHaveBeenCalled();
	});

	it("lists saved palettes in the collection dialog", async () => {
		authState.status = "signed-in";
		authState.user = { uid: "user-1" };
		collectionState.listPalettes.mockResolvedValueOnce([
			{
				id: "palette-1",
				name: "Brand palette",
				roles: defaultTheme("#a543bc").roles,
				typography: defaultTypography(),
				href: "/generate/a543bc",
				createdAt: "2026-07-05T00:00:00.000Z",
				updatedAt: "2026-07-05T00:00:00.000Z",
			},
		]);
		const { CollectionDialog } =
			await import("@/components/collection/collection-dialog");

		renderWithQuery(<CollectionDialog open onOpenChange={() => {}} />);

		expect(await screen.findByText("Brand palette")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Open Brand palette" }),
		).toBeInTheDocument();
		// Radix portals dialog content to document.body, outside the render container.
		const previewColors = screen
			.getByRole("dialog", { name: "My palettes" })
			.querySelectorAll('[style*="background-color"]');
		expect(previewColors).toHaveLength(1);
		expect(previewColors[0]).toHaveClass("aspect-square", "w-full");
		expect(previewColors[0]).toHaveAttribute("title", "#A543BC");
	});

	it("shows every color in a saved palette preview", async () => {
		authState.status = "signed-in";
		authState.user = { uid: "user-1" };
		const roles = Array.from({ length: 20 }, (_, index) => ({
			id: `role-${index}`,
			name: `Role ${index}`,
			hex: `#${index.toString(16).padStart(6, "0")}`,
		}));
		collectionState.listPalettes.mockResolvedValueOnce([
			{
				id: "palette-1",
				name: "Large palette",
				roles,
				typography: defaultTypography(),
				href: "/generate/000000",
				createdAt: "2026-07-05T00:00:00.000Z",
				updatedAt: "2026-07-05T00:00:00.000Z",
			},
		]);
		const { CollectionDialog } =
			await import("@/components/collection/collection-dialog");

		renderWithQuery(<CollectionDialog open onOpenChange={() => {}} />);

		await screen.findByText("Large palette");
		const previewColors = screen
			.getByRole("dialog", { name: "My palettes" })
			.querySelectorAll('[style*="background-color"]');
		expect(previewColors).toHaveLength(20);
	});

	it("shows a circular spinner while saved palettes load", async () => {
		authState.status = "signed-in";
		authState.user = { uid: "user-1" };
		collectionState.listPalettes.mockReturnValueOnce(new Promise(() => {}));
		const { CollectionDialog } =
			await import("@/components/collection/collection-dialog");

		renderWithQuery(<CollectionDialog open onOpenChange={() => {}} />);

		expect(
			await screen.findByRole("status", { name: "Loading palettes" }),
		).toHaveClass("animate-spin");
		expect(screen.queryByText("Loading palettes...")).not.toBeInTheDocument();
	});

	it("shows a circular spinner while a palette is renamed", async () => {
		authState.status = "signed-in";
		authState.user = { uid: "user-1" };
		collectionState.listPalettes.mockResolvedValueOnce([
			{
				id: "palette-1",
				name: "Brand palette",
				roles: defaultTheme("#a543bc").roles,
				typography: defaultTypography(),
				href: "/generate/a543bc",
				createdAt: "2026-07-05T00:00:00.000Z",
				updatedAt: "2026-07-05T00:00:00.000Z",
			},
		]);
		collectionState.renamePalette.mockReturnValueOnce(new Promise(() => {}));
		const { CollectionDialog } =
			await import("@/components/collection/collection-dialog");

		renderWithQuery(<CollectionDialog open onOpenChange={() => {}} />);
		await screen.findByText("Brand palette");
		fireEvent.click(screen.getByRole("button", { name: "Rename" }));
		fireEvent.change(screen.getByDisplayValue("Brand palette"), {
			target: { value: "Renamed palette" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(
			await screen.findByRole("status", { name: "Renaming palette" }),
		).toHaveClass("animate-spin");
		expect(
			screen.getByRole("button", { name: "Renaming palette" }),
		).toHaveAttribute("aria-busy", "true");
	});

	it("shows a circular spinner while a palette is deleted", async () => {
		authState.status = "signed-in";
		authState.user = { uid: "user-1" };
		collectionState.listPalettes.mockResolvedValueOnce([
			{
				id: "palette-1",
				name: "Brand palette",
				roles: defaultTheme("#a543bc").roles,
				typography: defaultTypography(),
				href: "/generate/a543bc",
				createdAt: "2026-07-05T00:00:00.000Z",
				updatedAt: "2026-07-05T00:00:00.000Z",
			},
		]);
		collectionState.deletePalette.mockReturnValueOnce(new Promise(() => {}));
		vi.spyOn(window, "confirm").mockReturnValueOnce(true);
		const { CollectionDialog } =
			await import("@/components/collection/collection-dialog");

		renderWithQuery(<CollectionDialog open onOpenChange={() => {}} />);
		await screen.findByText("Brand palette");
		fireEvent.click(screen.getByRole("button", { name: "Delete" }));

		expect(
			await screen.findByRole("status", { name: "Deleting palette" }),
		).toHaveClass("animate-spin");
		expect(
			screen.getByRole("button", { name: "Deleting palette" }),
		).toHaveAttribute("aria-busy", "true");
	});
});
