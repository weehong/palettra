"use client";

import type { JSX } from "react";

import type { Typography } from "@/lib/typography";
import { generateTypeScale, SCALE_RATIOS } from "@/lib/typography";
import { fontStack } from "@/lib/fonts";
import { FontPicker } from "@/components/generator/font-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type TypographyPanelProps = {
	typography: Typography;
	onChange: (next: Typography) => void;
	onRemove?: () => void;
};

const WEIGHT_SPECIMEN: ReadonlyArray<{ label: string; weight: number }> = [
	{ label: "Black", weight: 900 },
	{ label: "Extra-Bold", weight: 800 },
	{ label: "Bold", weight: 700 },
	{ label: "Semi-Bold", weight: 600 },
	{ label: "Medium", weight: 500 },
	{ label: "Regular", weight: 400 },
	{ label: "Light", weight: 300 },
	{ label: "Extra-Light", weight: 200 },
	{ label: "Thin", weight: 100 },
];

/** Editor for the typography tokens: font families, base size, and scale ratio. */
export function TypographyPanel({
	typography,
	onChange,
	onRemove,
}: TypographyPanelProps): JSX.Element {
	const scale = generateTypeScale(typography.baseSize, typography.ratio);

	function setFamily(key: keyof Typography["fonts"], value: string): void {
		onChange({ ...typography, fonts: { ...typography.fonts, [key]: value } });
	}

	function addTypographySample(): void {
		onChange({
			...typography,
			extraFamilies: [
				...(typography.extraFamilies ?? []),
				typography.fonts.heading,
			],
		});
	}

	function setExtraFamily(index: number, family: string): void {
		onChange({
			...typography,
			extraFamilies: (typography.extraFamilies ?? []).map((current, i) =>
				i === index ? family : current,
			),
		});
	}

	function setBaseSize(value: number): void {
		if (Number.isFinite(value) && value > 0) {
			onChange({ ...typography, baseSize: value });
		}
	}

	function setRatio(value: number): void {
		onChange({ ...typography, ratio: value });
	}

	function renderTypographySample(
		family: string,
		index: number,
		onFamilyChange: (family: string) => void,
	): JSX.Element {
		const sampleFamily = fontStack(family);
		return (
			<div
				data-testid="typography-sample"
				className="border-border bg-muted grid gap-5 rounded-lg border p-4 md:grid-cols-[minmax(5rem,8rem)_minmax(0,1fr)]"
			>
				<div className="bg-card flex min-h-72 flex-col gap-3 overflow-hidden rounded-md p-3">
					<FontPicker
						value={family}
						label={`Typography sample ${index}`}
						onChange={onFamilyChange}
					/>
					<p
						data-testid="typography-specimen-family"
						className="text-foreground m-auto text-6xl leading-none font-black"
						style={{
							fontFamily: sampleFamily,
							writingMode: "vertical-rl",
							transform: "rotate(180deg)",
						}}
					>
						{family}
					</p>
				</div>
				<div className="flex min-w-0 flex-col justify-center gap-2">
					{WEIGHT_SPECIMEN.map(({ label, weight }) => (
						<div key={label} className="flex min-w-0 flex-col">
							<p
								data-testid={
									label === "Black" ? "typography-sample-heading" : undefined
								}
								className="text-foreground truncate"
								style={{
									fontFamily: sampleFamily,
									fontSize: `${scale.xl}px`,
									fontStyle: "normal",
									fontWeight: weight,
								}}
							>
								{family} {label}
							</p>
							<p
								className="text-foreground truncate"
								style={{
									fontFamily: sampleFamily,
									fontSize: `${scale.xl}px`,
									fontStyle: "italic",
									fontWeight: weight,
								}}
							>
								{family} {label} Italic
							</p>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<section aria-label="Typography" className="flex min-h-full flex-col">
			<div className="flex flex-col gap-4 p-5 md:p-6">
				<div className="border-border flex flex-col gap-4 rounded-xl border p-5">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 className="text-foreground text-base font-semibold">
							Typography
						</h2>
					</div>

					{renderTypographySample(typography.fonts.heading, 1, (family) =>
						setFamily("heading", family),
					)}
					{(typography.extraFamilies ?? []).map((family, index) => (
						<div key={index}>
							{renderTypographySample(family, index + 2, (nextFamily) =>
								setExtraFamily(index, nextFamily),
							)}
						</div>
					))}
				</div>
			</div>

			<div
				data-testid="typography-sticky-footer"
				className="border-border bg-card sticky bottom-0 z-10 mt-auto flex flex-wrap items-end justify-between gap-3 border-t px-5 py-3 md:px-6"
			>
				<div className="flex flex-wrap items-end gap-4">
					<label className="flex flex-col gap-1">
						<span className="text-muted-foreground text-sm font-medium">
							Root size (px)
						</span>
						<Input
							type="number"
							min={1}
							value={typography.baseSize}
							onChange={(event) => setBaseSize(Number(event.target.value))}
							aria-label="Base font size in pixels"
							className="w-24"
						/>
					</label>

					<label className="flex flex-col gap-1">
						<span className="text-muted-foreground text-sm font-medium">
							Scale ratio
						</span>
						<Select
							value={String(typography.ratio)}
							onValueChange={(value) => setRatio(Number(value))}
						>
							<SelectTrigger
								aria-label="Modular scale ratio"
								className="w-44 text-base"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SCALE_RATIOS.map(({ name, value }) => (
									<SelectItem key={value} value={String(value)}>
										{name} ({value})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</label>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{onRemove ? (
						<Button
							variant="outline"
							data-testid="remove-typography"
							onClick={onRemove}
							className="w-fit px-3"
						>
							Remove Fonts
						</Button>
					) : null}
					<Button
						variant="outline"
						data-testid="add-typography"
						onClick={addTypographySample}
						className="w-fit px-3"
					>
						Add Typography
					</Button>
				</div>
			</div>
		</section>
	);
}
