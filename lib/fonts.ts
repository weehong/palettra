/**
 * Curated set of fonts offered in the typography picker. Non-`system` families
 * are Google Fonts loaded at runtime (see {@link googleFontsHref}); `system`
 * families render with the OS-installed face and need no request.
 */

export type FontCategory = "sans" | "serif" | "mono";

export type CuratedFont = {
	name: string;
	category: FontCategory;
	/** True for OS fonts that should not be requested from Google. */
	system?: true;
};

/**
 * Every non-`system` family must provide all of the {@link WEIGHTS} weights on
 * Google Fonts — they share a single css2 stylesheet URL, and one family with a
 * missing weight fails the whole request.
 */
export const CURATED_FONTS: ReadonlyArray<CuratedFont> = [
	// Sans
	{ name: "Inter", category: "sans" },
	{ name: "Roboto", category: "sans" },
	{ name: "Poppins", category: "sans" },
	{ name: "Montserrat", category: "sans" },
	{ name: "Open Sans", category: "sans" },
	{ name: "Lato", category: "sans" },
	{ name: "Work Sans", category: "sans" },
	{ name: "DM Sans", category: "sans" },
	{ name: "Albert Sans", category: "sans" },
	{ name: "Archivo", category: "sans" },
	{ name: "Barlow", category: "sans" },
	{ name: "Figtree", category: "sans" },
	{ name: "Geist", category: "sans" },
	{ name: "IBM Plex Sans", category: "sans" },
	{ name: "Jost", category: "sans" },
	{ name: "Karla", category: "sans" },
	{ name: "Lexend", category: "sans" },
	{ name: "Manrope", category: "sans" },
	{ name: "Nunito", category: "sans" },
	{ name: "Nunito Sans", category: "sans" },
	{ name: "Outfit", category: "sans" },
	{ name: "Plus Jakarta Sans", category: "sans" },
	{ name: "Public Sans", category: "sans" },
	{ name: "Raleway", category: "sans" },
	{ name: "Rubik", category: "sans" },
	{ name: "Sora", category: "sans" },
	{ name: "Source Sans 3", category: "sans" },
	{ name: "Space Grotesk", category: "sans" },
	{ name: "Urbanist", category: "sans" },
	// Serif
	{ name: "Playfair Display", category: "serif" },
	{ name: "Merriweather", category: "serif" },
	{ name: "Lora", category: "serif" },
	{ name: "Georgia", category: "serif", system: true },
	{ name: "Bitter", category: "serif" },
	{ name: "Cormorant Garamond", category: "serif" },
	{ name: "Crimson Pro", category: "serif" },
	{ name: "EB Garamond", category: "serif" },
	{ name: "Fraunces", category: "serif" },
	{ name: "Newsreader", category: "serif" },
	{ name: "Roboto Slab", category: "serif" },
	{ name: "Source Serif 4", category: "serif" },
	{ name: "Spectral", category: "serif" },
	{ name: "Zilla Slab", category: "serif" },
	// Mono
	{ name: "JetBrains Mono", category: "mono" },
	{ name: "Fira Code", category: "mono" },
	{ name: "IBM Plex Mono", category: "mono" },
	{ name: "Source Code Pro", category: "mono" },
	{ name: "Geist Mono", category: "mono" },
	{ name: "Inconsolata", category: "mono" },
	{ name: "Red Hat Mono", category: "mono" },
	{ name: "Roboto Mono", category: "mono" },
];

export const FONT_FALLBACK: Readonly<Record<FontCategory, string>> = {
	sans: "sans-serif",
	serif: "serif",
	mono: "monospace",
};

const BY_NAME = new Map(CURATED_FONTS.map((font) => [font.name, font]));

/** A usable CSS font stack for a family name, with a category-appropriate fallback. */
export function fontStack(name: string): string {
	const category = BY_NAME.get(name)?.category ?? "sans";
	return `'${name}', ${FONT_FALLBACK[category]}`;
}

/** Weights requested for the typography specimen and emitted FONT_WEIGHTS tokens. */
const WEIGHTS = "100;200;300;400;500;600;700;800;900";

/**
 * Build the Google Fonts `css2` stylesheet URL for the curated families,
 * skipping system fonts. Families are sorted so the URL is stable.
 */
export function googleFontsHref(): string {
	const families = CURATED_FONTS.filter((font) => !font.system)
		.map((font) => font.name)
		.sort();
	const params = families
		.map((name) => `family=${name.replace(/ /g, "+")}:wght@${WEIGHTS}`)
		.join("&");
	return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
