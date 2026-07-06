"use client";

import { useCallback, useEffect, useRef } from "react";

import type { SiteThemeVars } from "@/lib/site-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

type Snapshot = {
	value: string;
	priority: string;
} | null;

type ApplyState = {
	snapshots: Map<string, Snapshot>;
	appliedKeys: Set<string>;
};

function restoreProperty(
	style: CSSStyleDeclaration,
	key: string,
	snapshot: Snapshot,
): void {
	if (snapshot) {
		style.setProperty(key, snapshot.value, snapshot.priority);
	} else {
		style.removeProperty(key);
	}
}

function snapshotProperty(style: CSSStyleDeclaration, key: string): Snapshot {
	const value = style.getPropertyValue(key);
	const priority = style.getPropertyPriority(key);
	return value || priority ? { value, priority } : null;
}

function applyVars(
	style: CSSStyleDeclaration,
	vars: SiteThemeVars,
	state: ApplyState,
): void {
	const nextKeys = new Set(Object.keys(vars));
	for (const key of nextKeys) {
		if (!state.snapshots.has(key)) {
			state.snapshots.set(key, snapshotProperty(style, key));
		}
		style.setProperty(key, vars[key]);
	}

	for (const key of state.appliedKeys) {
		if (!nextKeys.has(key)) {
			restoreProperty(style, key, state.snapshots.get(key) ?? null);
		}
	}

	state.appliedKeys = nextKeys;
}

function restoreAll(style: CSSStyleDeclaration, state: ApplyState): void {
	for (const [key, snapshot] of state.snapshots) {
		restoreProperty(style, key, snapshot);
	}
	state.snapshots.clear();
	state.appliedKeys.clear();
}

function darkSchemeMedia(): MediaQueryList | null {
	if (
		typeof window === "undefined" ||
		typeof window.matchMedia !== "function"
	) {
		return null;
	}
	return window.matchMedia(DARK_QUERY);
}

/**
 * Apply the selected generated theme to document root while enabled.
 */
export function useSiteTheme(
	enabled: boolean,
	vars: { light: SiteThemeVars; dark: SiteThemeVars },
): void {
	const varsRef = useRef(vars);
	const stateRef = useRef<ApplyState>({
		snapshots: new Map(),
		appliedKeys: new Set(),
	});

	const applyCurrent = useCallback((): void => {
		if (typeof document === "undefined") {
			return;
		}
		const media = darkSchemeMedia();
		const scheme = media?.matches ? "dark" : "light";
		applyVars(
			document.documentElement.style,
			varsRef.current[scheme],
			stateRef.current,
		);
	}, []);

	useEffect(() => {
		varsRef.current = vars;
		if (enabled) {
			applyCurrent();
		}
	}, [applyCurrent, enabled, vars]);

	useEffect(() => {
		if (!enabled) {
			return;
		}
		applyCurrent();

		const media = darkSchemeMedia();
		const handleChange = (): void => applyCurrent();
		media?.addEventListener("change", handleChange);
		const style = document.documentElement.style;
		const state = stateRef.current;

		return () => {
			media?.removeEventListener("change", handleChange);
			if (typeof document !== "undefined") {
				restoreAll(style, state);
			}
		};
	}, [applyCurrent, enabled]);
}
