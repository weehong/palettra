import type { Metadata } from "next";
import type { JSX } from "react";
import { notFound } from "next/navigation";

import { generatePalette, normalizeHex } from "@/lib/color";
import { siteConfig } from "@/lib/site-config";
import type { Theme } from "@/lib/theme";
import { createPrimaryRole, decodeRoles } from "@/lib/theme";
import { decodeTypography } from "@/lib/typography";
import { PaletteGenerator } from "@/components/generator/palette-generator";

type GeneratePageProps = {
	params: Promise<{ hex: string }>;
	searchParams: Promise<{ colors?: string; type?: string }>;
};

export async function generateMetadata({
	params,
}: GeneratePageProps): Promise<Metadata> {
	const { hex } = await params;
	const normalized = normalizeHex(hex);
	if (!normalized) {
		return {
			title: "Color not found",
			robots: { index: false, follow: false },
		};
	}
	const palette = generatePalette(normalized);
	const title = `${palette.name} (${normalized}) Tailwind color system`;
	const description = `A production-ready Tailwind color system generated from ${normalized}, with 50–950 shades, UI previews, and export-ready tokens.`;
	const canonicalPath = `/generate/${normalized.slice(1)}`;
	return {
		title,
		description,
		alternates: { canonical: canonicalPath },
		// Metadata merging is shallow, so restate the full openGraph/twitter
		// blocks — a partial object here would drop the root layout's values.
		openGraph: {
			type: "website",
			locale: siteConfig.locale,
			url: canonicalPath,
			siteName: siteConfig.name,
			title,
			description,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			creator: siteConfig.twitterHandle,
		},
	};
}

export default async function GeneratePage({
	params,
	searchParams,
}: GeneratePageProps): Promise<JSX.Element> {
	const { hex } = await params;
	const normalized = normalizeHex(hex);
	if (!normalized) {
		notFound();
	}

	const { colors, type } = await searchParams;
	const theme: Theme = {
		roles: [createPrimaryRole(normalized), ...decodeRoles(colors)],
	};
	const typography = decodeTypography(type);

	return (
		<main className="mx-auto flex min-h-0 w-full max-w-none flex-1 flex-col gap-3 overflow-hidden px-5 py-4">
			{/* AI theme + Apply to site temporarily withdrawn: aiEnabled/
			    aiDefaultModel/applyToSiteEnabled intentionally not passed. */}
			<PaletteGenerator initialTheme={theme} initialTypography={typography} />
		</main>
	);
}
