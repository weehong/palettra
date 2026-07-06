"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseCopyToClipboard = {
	copiedKey: string | null;
	copy: (key: string, text: string) => Promise<void>;
};

/**
 * Clipboard helper that tracks which keyed item was most recently copied so a
 * single hook instance can drive per-element "Copied" feedback. The flag clears
 * itself after `resetMs`.
 */
export function useCopyToClipboard(resetMs = 1200): UseCopyToClipboard {
	const [copiedKey, setCopiedKey] = useState<string | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const copy = useCallback(
		async (key: string, text: string): Promise<void> => {
			try {
				if (typeof navigator !== "undefined" && navigator.clipboard) {
					await navigator.clipboard.writeText(text);
				}
			} catch {
				// Clipboard can reject in insecure contexts; still surface feedback.
			}
			setCopiedKey(key);
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(() => {
				setCopiedKey(null);
			}, resetMs);
		},
		[resetMs],
	);

	return { copiedKey, copy };
}
