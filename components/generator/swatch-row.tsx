"use client";

import type { JSX } from "react";

import type { PaletteShade } from "@/lib/color";
import { Swatch } from "@/components/generator/swatch";

type SwatchRowProps = {
	shades: ReadonlyArray<PaletteShade>;
	copiedKey: string | null;
	onCopy: (hex: string) => void;
};

/** The full 50–950 scale rendered as a responsive grid of swatches. */
export function SwatchRow({
	shades,
	copiedKey,
	onCopy,
}: SwatchRowProps): JSX.Element {
	return (
		<div data-testid="swatch-grid" className="swatch-grid grid gap-2">
			{shades.map((shade) => (
				<Swatch
					key={shade.shade}
					shade={shade}
					copied={copiedKey === shade.hex}
					onCopy={onCopy}
				/>
			))}
		</div>
	);
}
