import type { Metadata } from "next";
import type { JSX } from "react";
import { notFound } from "next/navigation";

import { generatePalette, normalizeHex } from "@/lib/color";
import { siteConfig } from "@/lib/site-config";
import type { Theme } from "@/lib/theme";
import {
	applyLockedRoles,
	applySemanticNames,
	createPrimaryRole,
	decodeRoles,
} from "@/lib/theme";
import { decodeTypography } from "@/lib/typography";
import { PaletteGenerator } from "@/components/generator/palette-generator";

type GeneratePageProps = {
	params: Promise<{ hex: string }>;
	searchParams: Promise<{
		colors?: string;
		type?: string;
		semantic?: string;
		semanticLocked?: string;
		primaryName?: string;
		locked?: string;
	}>;
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

	const { colors, type, semantic, semanticLocked, primaryName, locked } =
		await searchParams;
	const primaryRole = createPrimaryRole(normalized);
	if (primaryName?.trim()) primaryRole.name = primaryName.trim();
	const roles = applyLockedRoles(
		applySemanticNames([primaryRole, ...decodeRoles(colors)], semantic),
		locked,
	);
	const theme: Theme = {
		roles,
		semanticNamesLocked:
			semanticLocked === "1" &&
			roles.some((role) => Object.keys(role.semanticNames ?? {}).length > 0),
	};
	const typography = decodeTypography(type);
	const paletteName = generatePalette(normalized).name;

	return (
		<main
			data-generator-page
			className="mx-auto flex w-full max-w-none flex-none flex-col gap-3 overflow-visible px-5 py-4 md:min-h-0 md:flex-1 md:overflow-hidden"
		>
			<h1 className="sr-only">{paletteName} Tailwind color system</h1>
			{/* AI theme + Apply to site temporarily withdrawn: aiEnabled/
			    aiDefaultModel/applyToSiteEnabled intentionally not passed. */}
			<PaletteGenerator initialTheme={theme} initialTypography={typography} />
		</main>
	);
}
