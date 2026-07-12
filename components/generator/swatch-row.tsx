"use client";

import type { JSX } from "react";

import type { PaletteShade, Shade } from "@/lib/color";
import { Swatch } from "@/components/generator/swatch";

type SwatchRowProps = {
	shades: ReadonlyArray<PaletteShade>;
	copiedKey: string | null;
	onCopy: (hex: string) => void;
	semanticNames?: Partial<Record<Shade, string>>;
	onSemanticNameChange: (shade: Shade, name: string) => void;
};

/** The full 50–950 scale rendered as a responsive grid of swatches. */
export function SwatchRow({
	shades,
	copiedKey,
	onCopy,
	semanticNames,
	onSemanticNameChange,
}: SwatchRowProps): JSX.Element {
	return (
		<div data-testid="swatch-grid" className="swatch-grid grid gap-2">
			{shades.map((shade) => (
				<div key={shade.shade} className="min-w-0 space-y-1.5">
					<Swatch
						shade={shade}
						copied={copiedKey === shade.hex}
						onCopy={onCopy}
					/>
					<input
						type="text"
						value={semanticNames?.[shade.shade] ?? ""}
						onChange={(event) =>
							onSemanticNameChange(shade.shade, event.target.value)
						}
						placeholder="Semantic name"
						aria-label={`${shade.shade} semantic name`}
						className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring w-full rounded-md border px-2 py-1.5 text-xs focus:outline-none"
					/>
				</div>
			))}
		</div>
	);
}
