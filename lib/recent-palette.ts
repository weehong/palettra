export const RECENT_PALETTE_KEY = "palettra:recent-palette";

export function rememberPaletteHref(href: string): void {
	if (!href.startsWith("/generate/")) return;
	try {
		window.localStorage.setItem(RECENT_PALETTE_KEY, href);
	} catch {
		// Local persistence is an enhancement; private browsing may reject it.
	}
}

export function readRecentPaletteHref(): string | null {
	try {
		const href = window.localStorage.getItem(RECENT_PALETTE_KEY);
		return href?.startsWith("/generate/") ? href : null;
	} catch {
		return null;
	}
}
