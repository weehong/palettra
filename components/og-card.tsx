import type { JSX } from "react";

import { DEFAULT_HEX, generatePalette } from "@/lib/color";
import { siteConfig } from "@/lib/site-config";

type OgCardProps = {
	/** Base color for the swatch strip. Defaults to the brand palette. */
	paletteHex?: string;
	headline?: string;
	subline?: string;
};

/**
 * Shared layout for the Open Graph and Twitter card images.
 *
 * Rendered by satori via `next/og`, which only supports inline styles and
 * flexbox — no CSS grid, Tailwind classes, or stylesheets.
 */
export function OgCard({
	paletteHex = DEFAULT_HEX,
	headline = siteConfig.socialHeadline,
	subline = "50–950 scales · Real UI previews · Tailwind v3 / v4 / CSS variables",
}: OgCardProps = {}): JSX.Element {
	const palette = generatePalette(paletteHex);
	const host = new URL(siteConfig.url).host;

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "72px 80px 64px",
				background: siteConfig.themeColor,
				color: siteConfig.backgroundColor,
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				<div
					style={{
						fontSize: 28,
						letterSpacing: 8,
						textTransform: "uppercase",
						opacity: 0.7,
					}}
				>
					{siteConfig.name}
				</div>
				{/* No fontWeight: next/og bundles only a regular-weight font and
				    satori does not synthesize bold. */}
				<div
					style={{
						fontSize: 68,
						lineHeight: 1.1,
						maxWidth: 980,
					}}
				>
					{headline}
				</div>
				<div style={{ fontSize: 28, opacity: 0.75 }}>{subline}</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
				<div
					style={{
						display: "flex",
						width: "100%",
						height: 110,
						borderRadius: 16,
						overflow: "hidden",
					}}
				>
					{palette.shades.map((shade) => (
						<div
							key={shade.shade}
							style={{
								flex: 1,
								display: "flex",
								alignItems: "flex-end",
								justifyContent: "center",
								paddingBottom: 10,
								backgroundColor: shade.hex,
								color:
									shade.shade >= 500
										? "rgba(255, 255, 255, 0.85)"
										: "rgba(0, 0, 0, 0.6)",
								fontSize: 18,
							}}
						>
							{shade.shade}
						</div>
					))}
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "flex-end",
						fontSize: 24,
						opacity: 0.6,
					}}
				>
					{host}
				</div>
			</div>
		</div>
	);
}
