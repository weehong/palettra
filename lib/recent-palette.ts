export const RECENT_PALETTE_KEY = "palettra:recent-palette";
const RECENT_PALETTE_EVENT = "palettra:recent-palette-change";

export function rememberPaletteHref(href: string): void {
	if (!href.startsWith("/generate/")) return;
	try {
		window.localStorage.setItem(RECENT_PALETTE_KEY, href);
		window.dispatchEvent(new Event(RECENT_PALETTE_EVENT));
	} catch {
		// Local persistence is an enhancement; private browsing may reject it.
	}
}

export function readRestorablePaletteHref(): string | null {
	const href = readRecentPaletteHref();
	if (!href) return null;

	return href === `${window.location.pathname}${window.location.search}`
		? null
		: href;
}

export function subscribeToRecentPalette(callback: () => void): () => void {
	function handleStorage(event: StorageEvent): void {
		if (event.key === RECENT_PALETTE_KEY) callback();
	}

	window.addEventListener(RECENT_PALETTE_EVENT, callback);
	window.addEventListener("storage", handleStorage);

	return () => {
		window.removeEventListener(RECENT_PALETTE_EVENT, callback);
		window.removeEventListener("storage", handleStorage);
	};
}

export function readRecentPaletteHref(): string | null {
	try {
		const href = window.localStorage.getItem(RECENT_PALETTE_KEY);
		return href?.startsWith("/generate/") ? href : null;
	} catch {
		return null;
	}
}
