import { beforeEach, describe, expect, it, vi } from "vitest";

import { defaultTheme } from "@/lib/theme";
import { defaultTypography } from "@/lib/typography";
import {
	deleteAllPalettes,
	isSafePaletteHref,
	paletteDocFromState,
} from "@/lib/palette-collection";

const firestoreState = vi.hoisted(() => ({
	getDocs: vi.fn(),
	writeBatch: vi.fn(),
	limit: vi.fn((count: number) => ({ type: "limit", count })),
	query: vi.fn((...args: Array<unknown>) => ({ type: "query", args })),
	collectionRef: { type: "collection" },
}));

vi.mock("firebase/firestore", () => ({
	addDoc: vi.fn(),
	collection: vi.fn(() => ({
		withConverter: vi.fn(() => firestoreState.collectionRef),
	})),
	deleteDoc: vi.fn(),
	doc: vi.fn(),
	getDocs: (...args: Array<unknown>) => firestoreState.getDocs(...args),
	limit: (count: number) => firestoreState.limit(count),
	orderBy: vi.fn(),
	query: (...args: Array<unknown>) => firestoreState.query(...args),
	serverTimestamp: vi.fn(),
	updateDoc: vi.fn(),
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

	it("accepts only safe internal generate hrefs", () => {
		expect(isSafePaletteHref("/generate/a543bc")).toBe(true);
		expect(isSafePaletteHref("/generate/abc?colors=secondary~123456~a")).toBe(
			true,
		);
		expect(isSafePaletteHref("/generate/12345678?type=Inter~Georgia")).toBe(
			true,
		);
	});

	it("rejects unsafe palette hrefs", () => {
		expect(isSafePaletteHref("javascript:alert(1)")).toBe(false);
		expect(isSafePaletteHref("https://example.com/generate/a543bc")).toBe(false);
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
