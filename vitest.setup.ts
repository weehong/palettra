import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

type PreferredColorScheme = "light" | "dark";

declare global {
	// Test helper for components/hooks that react to prefers-color-scheme.
	var __setPreferredColorScheme: (scheme: PreferredColorScheme) => void;
	var __preferredColorScheme: () => PreferredColorScheme;
}

// jsdom has no ResizeObserver; Radix UI primitives require it.
globalThis.ResizeObserver ??= class {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
} as unknown as typeof ResizeObserver;

// Radix UI primitives in jsdom: pointer-capture and scrolling APIs are missing.
globalThis.PointerEvent ??= MouseEvent as unknown as typeof PointerEvent;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

let preferredColorScheme: PreferredColorScheme = "light";
const mediaQueryLists = new Set<TestMediaQueryList>();

class TestMediaQueryList extends EventTarget implements MediaQueryList {
	onchange:
		| ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown)
		| null = null;

	constructor(readonly media: string) {
		super();
	}

	get matches(): boolean {
		if (this.media.includes("prefers-color-scheme: dark")) {
			return preferredColorScheme === "dark";
		}
		if (this.media.includes("prefers-color-scheme: light")) {
			return preferredColorScheme === "light";
		}
		return false;
	}

	addListener(
		listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown,
	): void {
		this.addEventListener("change", listener as EventListener);
	}

	removeListener(
		listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown,
	): void {
		this.removeEventListener("change", listener as EventListener);
	}

	dispatchChange(): void {
		const event = new Event("change") as MediaQueryListEvent;
		Object.defineProperties(event, {
			matches: { value: this.matches },
			media: { value: this.media },
		});
		this.dispatchEvent(event);
		this.onchange?.call(this, event);
	}
}

Object.defineProperty(window, "matchMedia", {
	configurable: true,
	writable: true,
	value: (query: string): MediaQueryList => {
		const list = new TestMediaQueryList(query);
		mediaQueryLists.add(list);
		return list;
	},
});

globalThis.__preferredColorScheme = () => preferredColorScheme;
globalThis.__setPreferredColorScheme = (scheme: PreferredColorScheme): void => {
	if (preferredColorScheme === scheme) {
		return;
	}
	preferredColorScheme = scheme;
	for (const list of mediaQueryLists) {
		list.dispatchChange();
	}
};

// Unmount React trees after every test to avoid cross-test DOM leakage.
afterEach(() => {
	cleanup();
	preferredColorScheme = "light";
	mediaQueryLists.clear();
	document.documentElement.removeAttribute("style");
});
