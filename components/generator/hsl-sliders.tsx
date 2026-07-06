"use client";

import type { JSX } from "react";

import type { Hsl } from "@/lib/color";
import { hexToHsl, hslToHex } from "@/lib/color";
import { Slider } from "@/components/ui/slider";

type HslSlidersProps = {
	baseHex: string;
	onHexChange: (hex: string) => void;
};

type Channel = "h" | "s" | "l";

const CHANNELS: ReadonlyArray<{ key: Channel; label: string; max: number }> = [
	{ key: "h", label: "Hue", max: 360 },
	{ key: "s", label: "Saturation", max: 100 },
	{ key: "l", label: "Lightness", max: 100 },
];

/** H/S/L sliders that shift the whole palette by rewriting the base color. */
export function HslSliders({
	baseHex,
	onHexChange,
}: HslSlidersProps): JSX.Element {
	const current = hexToHsl(baseHex);

	function update(channel: Channel, value: number): void {
		const next: Hsl = { ...current, [channel]: value };
		onHexChange(hslToHex(next));
	}

	return (
		<div className="grid gap-4 sm:grid-cols-3">
			{CHANNELS.map(({ key, label, max }) => (
				<div key={key} className="flex flex-col gap-1">
					<span className="flex items-center justify-between text-sm font-medium text-muted-foreground">
						<span>{label}</span>
						<span className="font-mono tabular-nums">
							{Math.round(current[key])}
						</span>
					</span>
					<Slider
						min={0}
						max={max}
						step={1}
						value={[Math.round(current[key])]}
						thumbLabels={[label]}
						onValueChange={([value]) => update(key, value)}
						className="py-1.5"
					/>
				</div>
			))}
		</div>
	);
}
