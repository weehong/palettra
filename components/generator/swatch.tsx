"use client";

import type { JSX } from "react";

import type { PaletteShade } from "@/lib/color";

type SwatchProps = {
	shade: PaletteShade;
	copied: boolean;
	onCopy: (hex: string) => void;
};

/** A single shade tile: colored block with shade number, hex, and copy action. */
export function Swatch({ shade, copied, onCopy }: SwatchProps): JSX.Element {
	const onLight = shade.hsl.l > 55;
	const textColor = onLight ? "#000000" : "#ffffff";

	return (
		<button
			type="button"
			data-testid="swatch"
			onClick={() => onCopy(shade.hex)}
			title={`Copy ${shade.hex}`}
			className="group relative flex h-20 flex-col justify-between rounded-lg p-2 text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-24"
			style={{ backgroundColor: shade.hex, color: textColor }}
		>
			<span className="flex items-center justify-between text-xs font-semibold">
				<span>{shade.shade}</span>
				{shade.isAnchor ? (
					<span
						aria-label="Base color"
						className="rounded-full px-1.5 py-0.5 text-xs font-medium"
						style={{
							backgroundColor: onLight
								? "rgba(0,0,0,0.12)"
								: "rgba(255,255,255,0.2)",
						}}
					>
						Base
					</span>
				) : null}
			</span>
			<span className="font-mono text-xs tracking-tight tabular-nums">
				{copied ? "Copied!" : shade.hex}
			</span>
		</button>
	);
}
