import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { generatePalette, normalizeHex } from "@/lib/color";
import { OgCard } from "@/components/og-card";
import { siteConfig } from "@/lib/site-config";

export const alt = `${siteConfig.name} — generated Tailwind color system`;
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

type ImageProps = {
	params: Promise<{ hex: string }>;
};

export default async function TwitterImage({
	params,
}: ImageProps): Promise<ImageResponse> {
	const { hex } = await params;
	const normalized = normalizeHex(hex);
	if (!normalized) {
		// Match the page: invalid hexes 404 instead of serving a generic image.
		notFound();
	}

	const palette = generatePalette(normalized);
	return new ImageResponse(
		<OgCard
			paletteHex={normalized}
			headline={`${palette.name} · ${normalized}`}
			subline={`A 50–950 Tailwind color system generated from ${normalized}`}
		/>,
		{ ...size },
	);
}
