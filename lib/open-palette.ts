import type { Theme } from "@/lib/theme";
import type { Typography } from "@/lib/typography";

const OPEN_PALETTE_EVENT = "palettra:open-palette";

export type OpenPaletteDetail = {
	theme: Theme;
	typography?: Typography;
	savedPalette?: OpenedSavedPalette;
};

export type OpenedSavedPalette = {
	id: string;
	name: string;
};

const PENDING_SAVED_PALETTE_KEY = "palettra:pending-saved-palette";

export function openPaletteOnCurrentPage(detail: OpenPaletteDetail): boolean {
	const pathname = window.location.pathname;
	if (pathname !== "/" && !pathname.startsWith("/generate/")) return false;

	window.dispatchEvent(
		new CustomEvent<OpenPaletteDetail>(OPEN_PALETTE_EVENT, { detail }),
	);
	return true;
}

export function subscribeToPaletteOpen(
	callback: (detail: OpenPaletteDetail) => void,
): () => void {
	function handleOpen(event: Event): void {
		callback((event as CustomEvent<OpenPaletteDetail>).detail);
	}

	window.addEventListener(OPEN_PALETTE_EVENT, handleOpen);
	return () => window.removeEventListener(OPEN_PALETTE_EVENT, handleOpen);
}

export function rememberPendingSavedPalette(palette: OpenedSavedPalette): void {
	window.sessionStorage.setItem(
		PENDING_SAVED_PALETTE_KEY,
		JSON.stringify(palette),
	);
}

export function readPendingSavedPalette(): OpenedSavedPalette | null {
	const value = window.sessionStorage.getItem(PENDING_SAVED_PALETTE_KEY);
	if (!value) return null;

	try {
		const palette = JSON.parse(value) as Partial<OpenedSavedPalette>;
		return typeof palette.id === "string" && typeof palette.name === "string"
			? { id: palette.id, name: palette.name }
			: null;
	} catch {
		return null;
	}
}

export function clearPendingSavedPalette(): void {
	window.sessionStorage.removeItem(PENDING_SAVED_PALETTE_KEY);
}
