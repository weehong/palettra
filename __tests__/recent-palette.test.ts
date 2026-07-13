import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
	readRestorablePaletteHref,
	rememberPaletteHref,
} from "@/lib/recent-palette";

describe("recent palette", () => {
	beforeAll(() => {
		const values = new Map<string, string>();
		Object.defineProperty(window, "localStorage", {
			configurable: true,
			value: {
				clear: () => values.clear(),
				getItem: (key: string) => values.get(key) ?? null,
				setItem: (key: string, value: string) => values.set(key, value),
			},
		});
	});

	beforeEach(() => {
		window.localStorage.clear();
		window.history.replaceState(null, "", "/");
	});

	it("returns a palette only when it differs from the current URL", () => {
		rememberPaletteHref("/generate/a543bc?colors=secondary~123456~a");

		expect(readRestorablePaletteHref()).toBe(
			"/generate/a543bc?colors=secondary~123456~a",
		);

		window.history.replaceState(
			null,
			"",
			"/generate/a543bc?colors=secondary~123456~a",
		);
		expect(readRestorablePaletteHref()).toBeNull();
	});
});
