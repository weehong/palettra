import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultTheme } from "@/lib/theme";
import { defaultTypography } from "@/lib/typography";
import {
	deleteAllPalettes,
	isSafePaletteHref,
	listPalettes,
	paletteDocFromState,
	updatePalette,
} from "@/lib/palette-collection";

const firestoreState = vi.hoisted(() => ({
	getDocs: vi.fn(),
	writeBatch: vi.fn(),
	limit: vi.fn((count: number) => ({ type: "limit", count })),
	query: vi.fn((...args: Array<unknown>) => ({ type: "query", args })),
	collectionRef: { type: "collection" },
	updateDoc: vi.fn(),
	doc: vi.fn((...segments: Array<unknown>) => ({ segments })),
}));

vi.mock("firebase/firestore", () => ({
	addDoc: vi.fn(),
	collection: vi.fn(() => ({
		withConverter: vi.fn(() => firestoreState.collectionRef),
	})),
	deleteDoc: vi.fn(),
	doc: (...args: Array<unknown>) => firestoreState.doc(...args),
	getDocs: (...args: Array<unknown>) => firestoreState.getDocs(...args),
	limit: (count: number) => firestoreState.limit(count),
	orderBy: vi.fn(),
	query: (...args: Array<unknown>) => firestoreState.query(...args),
	serverTimestamp: vi.fn(),
	updateDoc: (...args: Array<unknown>) => firestoreState.updateDoc(...args),
	writeBatch: (...args: Array<unknown>) => firestoreState.writeBatch(...args),
}));

function paletteDocs(count: number): Array<{ ref: { id: string } }> {
	return Array.from({ length: count }, (_, index) => ({
		ref: { id: `palette-${index}` },
	}));
}

describe("palette collection data helpers", () => {
	beforeEach(() => {
		firestoreState.getDocs.mockReset();
		firestoreState.writeBatch.mockReset();
		firestoreState.limit.mockClear();
		firestoreState.query.mockClear();
		firestoreState.updateDoc.mockReset();
		firestoreState.doc.mockClear();
	});

	it("builds a Firestore input from theme state", () => {
		const theme = defaultTheme("#a543bc");
		const typography = defaultTypography();

		const doc = paletteDocFromState(theme, typography);

		expect(doc.name).toBe("Primary #a543bc");
		expect(doc.href).toBe("/generate/a543bc");
		expect(doc.roles).toEqual(theme.roles);
		expect(doc.typography).toEqual(typography);
	});

	it("strips undefined values from saved roles", () => {
		const theme = defaultTheme("#2563eb");

		const doc = paletteDocFromState(theme, defaultTypography());

		expect("preset" in doc.roles[0]).toBe(false);
	});

	it("includes semantic names in the saved document", () => {
		const theme = defaultTheme("#2563eb");
		theme.roles[0].semanticNames = { 200: "surface-muted" };

		const doc = paletteDocFromState(theme, defaultTypography());

		expect(doc.roles[0].semanticNames).toEqual({ 200: "surface-muted" });
		expect(doc.href).toContain("semantic=0~200~surface-muted");
		expect(doc.href).not.toContain("semanticLocked");
	});

	it("restores semantic names from Firestore", async () => {
		const theme = defaultTheme("#2563eb");
		theme.roles[0].semanticNames = { 200: "surface-muted" };
		firestoreState.getDocs.mockResolvedValueOnce({
			docs: [
				{
					id: "palette-1",
					data: () => ({
						name: "Brand palette",
						roles: theme.roles,
						typography: defaultTypography(),
						href: "/generate/2563eb?semantic=0~200~surface-muted",
					}),
				},
			],
		});

		const [palette] = await listPalettes({ app: "db" } as never, "user-1");

		expect(palette.roles[0].semanticNames).toEqual({ 200: "surface-muted" });
	});

	it("updates an existing palette without replacing its creation timestamp", async () => {
		firestoreState.updateDoc.mockResolvedValueOnce(undefined);
		const input = paletteDocFromState(
			defaultTheme("#2563eb"),
			defaultTypography(),
		);

		await updatePalette({ app: "db" } as never, "user-1", "palette-1", input);

		expect(firestoreState.doc).toHaveBeenCalledWith(
			expect.anything(),
			"users",
			"user-1",
			"palettes",
			"palette-1",
		);
		expect(firestoreState.updateDoc).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				name: "Primary #2563eb",
				updatedAt: undefined,
			}),
		);
		expect(firestoreState.updateDoc.mock.calls[0][1]).not.toHaveProperty(
			"createdAt",
		);
	});

	it("accepts only safe internal generate hrefs", () => {
		expect(isSafePaletteHref("/generate/a543bc")).toBe(true);
		expect(isSafePaletteHref("/generate/abc?colors=secondary~123456~a")).toBe(
			true,
		);
		expect(isSafePaletteHref("/generate/12345678?type=Inter~Georgia")).toBe(
			true,
		);
		expect(
			isSafePaletteHref("/generate/abc?semantic=0~200~surface-muted"),
		).toBe(true);
	});

	it("rejects unsafe palette hrefs", () => {
		expect(isSafePaletteHref("javascript:alert(1)")).toBe(false);
		expect(isSafePaletteHref("https://example.com/generate/a543bc")).toBe(
			false,
		);
		expect(isSafePaletteHref("//example.com/generate/a543bc")).toBe(false);
		expect(isSafePaletteHref("/settings")).toBe(false);
	});

	it("deletes all palettes in Firestore batches", async () => {
		const firstBatch = {
			delete: vi.fn(),
			commit: vi.fn().mockResolvedValue(undefined),
		};
		const secondBatch = {
			delete: vi.fn(),
			commit: vi.fn().mockResolvedValue(undefined),
		};
		firestoreState.writeBatch
			.mockReturnValueOnce(firstBatch)
			.mockReturnValueOnce(secondBatch);
		firestoreState.getDocs
			.mockResolvedValueOnce({ docs: paletteDocs(500) })
			.mockResolvedValueOnce({ docs: paletteDocs(1) });

		await deleteAllPalettes({ app: "db" } as never, "user-1");

		expect(firestoreState.limit).toHaveBeenCalledWith(500);
		expect(firstBatch.delete).toHaveBeenCalledTimes(500);
		expect(firstBatch.commit).toHaveBeenCalledTimes(1);
		expect(secondBatch.delete).toHaveBeenCalledTimes(1);
		expect(secondBatch.commit).toHaveBeenCalledTimes(1);
		expect(firestoreState.getDocs).toHaveBeenCalledTimes(2);
	});

	it("does not commit a batch when there are no palettes", async () => {
		firestoreState.getDocs.mockResolvedValueOnce({ docs: [] });

		await deleteAllPalettes({ app: "db" } as never, "user-1");

		expect(firestoreState.writeBatch).not.toHaveBeenCalled();
	});
});
