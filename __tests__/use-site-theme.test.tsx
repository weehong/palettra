import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SiteThemeVars } from "@/lib/site-theme";
import { useSiteTheme } from "@/components/generator/use-site-theme";

function ThemeHarness({
	enabled,
	vars,
}: {
	enabled: boolean;
	vars: { light: SiteThemeVars; dark: SiteThemeVars };
}): null {
	useSiteTheme(enabled, vars);
	return null;
}

const initialVars = {
	light: {
		"--background": "#ffffff",
		"--primary": "#2563eb",
		"--destructive": "#dc2626",
	},
	dark: {
		"--background": "#020617",
		"--primary": "#60a5fa",
		"--destructive": "#f87171",
	},
};

describe("useSiteTheme", () => {
	it("applies, updates, removes stale keys, and restores previous inline values", () => {
		const root = document.documentElement;
		root.style.setProperty("--primary", "#123456", "important");
		const { rerender, unmount } = render(
			<ThemeHarness enabled={false} vars={initialVars} />,
		);

		expect(root.style.getPropertyValue("--primary")).toBe("#123456");

		rerender(<ThemeHarness enabled vars={initialVars} />);

		expect(root.style.getPropertyValue("--background")).toBe("#ffffff");
		expect(root.style.getPropertyValue("--primary")).toBe("#2563eb");
		expect(root.style.getPropertyPriority("--primary")).toBe("");
		expect(root.style.getPropertyValue("--destructive")).toBe("#dc2626");

		rerender(
			<ThemeHarness
				enabled
				vars={{
					light: { "--background": "#f8fafc", "--primary": "#16a34a" },
					dark: { "--background": "#111827", "--primary": "#4ade80" },
				}}
			/>,
		);

		expect(root.style.getPropertyValue("--background")).toBe("#f8fafc");
		expect(root.style.getPropertyValue("--primary")).toBe("#16a34a");
		expect(root.style.getPropertyValue("--destructive")).toBe("");

		rerender(<ThemeHarness enabled={false} vars={initialVars} />);

		expect(root.style.getPropertyValue("--background")).toBe("");
		expect(root.style.getPropertyValue("--primary")).toBe("#123456");
		expect(root.style.getPropertyPriority("--primary")).toBe("important");

		rerender(<ThemeHarness enabled vars={initialVars} />);
		unmount();

		expect(root.style.getPropertyValue("--background")).toBe("");
		expect(root.style.getPropertyValue("--primary")).toBe("#123456");
		expect(root.style.getPropertyPriority("--primary")).toBe("important");
	});

	it("swaps schemes while enabled and removes the listener on cleanup", () => {
		const root = document.documentElement;
		const { unmount } = render(<ThemeHarness enabled vars={initialVars} />);

		expect(root.style.getPropertyValue("--background")).toBe("#ffffff");

		globalThis.__setPreferredColorScheme("dark");

		expect(root.style.getPropertyValue("--background")).toBe("#020617");

		unmount();
		globalThis.__setPreferredColorScheme("light");

		expect(root.style.getPropertyValue("--background")).toBe("");
	});

	it("does not crash without matchMedia", () => {
		const original = window.matchMedia;
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		// @ts-expect-error jsdom test intentionally removes this browser API.
		delete window.matchMedia;

		expect(() =>
			render(<ThemeHarness enabled vars={initialVars} />),
		).not.toThrow();
		expect(
			document.documentElement.style.getPropertyValue("--background"),
		).toBe("#ffffff");

		window.matchMedia = original;
		error.mockRestore();
	});
});
