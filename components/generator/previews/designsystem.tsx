import type { JSX, ReactNode } from "react";

import { contrastGrade, contrastRatio, readableTextColor } from "@/lib/color";
import { fontStack } from "@/lib/fonts";
import {
	FONT_WEIGHTS,
	LINE_HEIGHTS,
	SIZE_STEPS,
	generateTypeScale,
} from "@/lib/typography";
import type { PreviewProps } from "@/components/generator/previews/index";

/** Minimal inline icons (no icon dependency). */
function Icon({ name }: { name: string }): JSX.Element {
	const common = {
		width: 18,
		height: 18,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
	};
	switch (name) {
		case "search":
			return (
				<svg {...common} aria-hidden="true">
					<circle cx="11" cy="11" r="7" />
					<path d="m21 21-4.3-4.3" />
				</svg>
			);
		case "home":
			return (
				<svg {...common} aria-hidden="true">
					<path d="M3 10.5 12 3l9 7.5" />
					<path d="M5 9.5V21h14V9.5" />
				</svg>
			);
		case "user":
			return (
				<svg {...common} aria-hidden="true">
					<circle cx="12" cy="8" r="4" />
					<path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
				</svg>
			);
		case "check":
			return (
				<svg {...common} aria-hidden="true">
					<path d="M20 6 9 17l-5-5" />
				</svg>
			);
		default:
			return <svg {...common} aria-hidden="true" />;
	}
}

function Section({
	title,
	caption,
	children,
}: {
	title: string;
	caption?: string;
	children: ReactNode;
}): JSX.Element {
	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-baseline gap-2">
				<h3 className="text-sm font-bold tracking-wide text-zinc-900 uppercase">
					{title}
				</h3>
				{caption ? (
					<span className="text-xs text-zinc-500">{caption}</span>
				) : null}
			</div>
			{children}
		</section>
	);
}

function Card({ children }: { children: ReactNode }): JSX.Element {
	return (
		<div
			className="rounded-2xl p-5"
			style={{ backgroundColor: "var(--primary-50)" }}
		>
			{children}
		</div>
	);
}

function shadeHex(
	palette: PreviewProps["palettes"][number],
	shade: number,
): string {
	return palette.shades.find((s) => s.shade === shade)?.hex ?? palette.baseHex;
}

/** Status color for a WCAG grade: green = passes, amber = large-only, red = fail. */
function gradeClass(grade: string): string {
	if (grade === "Fail") {
		return "bg-red-600";
	}
	if (grade === "AA Large") {
		return "bg-amber-500";
	}
	return "bg-emerald-600";
}

// ── Colors ──────────────────────────────────────────────────────────────────

function ColorsSection({
	palettes,
}: {
	palettes: PreviewProps["palettes"];
}): JSX.Element {
	return (
		<Section
			title="Color"
			caption="50–950 scale · WCAG AA: 4.5:1 normal text, 3:1 large text"
		>
			<div className="flex flex-col gap-4">
				{palettes.map((palette) => {
					const headerText = readableTextColor(palette.baseHex);
					const bg600 = shadeHex(palette, 600);
					const onColor = readableTextColor(bg600);
					const ratio = contrastRatio(onColor, bg600);
					const grade = contrastGrade(ratio);
					return (
						<div
							key={palette.name}
							className="overflow-hidden rounded-2xl bg-white shadow-sm"
						>
							<div
								className="flex flex-wrap items-center justify-between gap-3 p-4"
								style={{ backgroundColor: palette.baseHex, color: headerText }}
							>
								<span className="text-sm font-semibold capitalize">
									{palette.name}
									<span className="ml-2 font-mono text-xs font-normal opacity-70">
										{palette.baseHex.toUpperCase()}
									</span>
								</span>
								<div className="flex items-center gap-2">
									<span className="text-[11px] opacity-80">Text on 600</span>
									<span
										className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold"
										style={{ backgroundColor: bg600, color: onColor }}
										aria-hidden="true"
									>
										Aa
									</span>
									<span
										className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${gradeClass(grade)}`}
										title={`Contrast of text on the 600 shade: ${grade}, ${ratio.toFixed(1)}:1`}
									>
										{grade} · {ratio.toFixed(1)}:1
									</span>
								</div>
							</div>
							<div className="flex">
								{palette.shades.map((shade) => (
									<div key={shade.shade} className="flex-1">
										<div
											className="h-12"
											style={{ backgroundColor: shade.hex }}
										/>
										<div className="flex flex-col items-center gap-0.5 py-1">
											<span className="text-[10px] font-medium text-zinc-700">
												{shade.shade}
											</span>
											<span className="font-mono text-[8px] text-zinc-400">
												{shade.hex.toUpperCase()}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</Section>
	);
}

// ── Typography ────────────────────────────────────────────────────────────────

function TypeSection({
	typography,
}: {
	typography: PreviewProps["typography"];
}): JSX.Element {
	const scale = generateTypeScale(typography.baseSize, typography.ratio);
	const sans = fontStack(typography.fonts.sans);
	const heading = fontStack(typography.fonts.heading);
	const extraFamilies = typography.extraFamilies ?? [];

	return (
		<Section
			title="Typography"
			caption={`${typography.fonts.heading} / ${typography.fonts.sans}${extraFamilies.length > 0 ? ` + ${extraFamilies.length} extra` : ""} · base ${typography.baseSize}px · ratio ${typography.ratio}`}
		>
			<Card>
				<div className="flex flex-col divide-y divide-zinc-200">
					{[...SIZE_STEPS].reverse().map(({ name }) => (
						<div key={name} className="flex items-baseline gap-4 py-2">
							<span className="w-10 shrink-0 font-mono text-xs text-zinc-400">
								{name}
							</span>
							<span className="w-12 shrink-0 font-mono text-xs text-zinc-400">
								{scale[name]}px
							</span>
							<span
								className="truncate"
								style={{
									fontFamily: heading,
									fontSize: `${scale[name]}px`,
									lineHeight: 1.1,
									color: "var(--secondary-900, var(--primary-950))",
								}}
							>
								Sphinx of black quartz
							</span>
						</div>
					))}
				</div>
			</Card>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Card>
					<p className="mb-3 text-xs font-medium text-zinc-500">Weights</p>
					<div className="flex flex-col gap-1">
						{Object.entries(FONT_WEIGHTS).map(([label, weight]) => (
							<div key={label} className="flex items-baseline gap-3">
								<span className="w-20 shrink-0 text-xs text-zinc-400 capitalize">
									{label} {weight}
								</span>
								<span
									style={{ fontFamily: sans, fontWeight: weight, fontSize: 18 }}
								>
									The quick brown fox
								</span>
							</div>
						))}
					</div>
				</Card>

				<Card>
					<p className="mb-3 text-xs font-medium text-zinc-500">Line height</p>
					<div className="grid grid-cols-3 gap-3">
						{(["tight", "normal", "relaxed"] as const).map((key) => (
							<div key={key}>
								<p className="mb-1 text-[11px] text-zinc-400">
									{key} {LINE_HEIGHTS[key]}
								</p>
								<p
									className="text-xs text-zinc-700"
									style={{ lineHeight: LINE_HEIGHTS[key] }}
								>
									Good type sets a clear rhythm across multiple lines of text.
								</p>
							</div>
						))}
					</div>
				</Card>
			</div>

			<Card>
				<p className="mb-3 text-xs font-medium text-zinc-500">
					Selected typography
				</p>
				<div className="flex flex-col gap-2 text-zinc-800">
					{(
						[
							["Heading", typography.fonts.heading],
							["Sans", typography.fonts.sans],
							["Serif", typography.fonts.serif],
							["Mono", typography.fonts.mono],
							...extraFamilies.map(
								(family, index) => [`Extra ${index + 1}`, family] as const,
							),
						] as const
					).map(([label, family]) => (
						<div
							key={`${label}-${family}`}
							className="flex items-baseline gap-3"
						>
							<span className="w-36 shrink-0 text-xs text-zinc-400">
								{label.startsWith("Extra") ? `Extra · ${family}` : label}
							</span>
							<span
								className="min-w-0 truncate"
								style={{ fontFamily: fontStack(family), fontSize: 16 }}
							>
								{label.startsWith("Extra")
									? "The quick brown fox"
									: `${family} — Pack my box with five dozen liquor jugs.`}
							</span>
						</div>
					))}
				</div>
			</Card>
		</Section>
	);
}

// ── Components & forms ────────────────────────────────────────────────────────

function ComponentsSection(): JSX.Element {
	return (
		<Section title="Components">
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<Card>
					<p className="mb-3 text-xs font-medium text-zinc-500">
						Button states
					</p>
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
							style={{ backgroundColor: "var(--primary-600)" }}
						>
							Default
						</button>
						<button
							type="button"
							className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
							style={{ backgroundColor: "var(--primary-700)" }}
						>
							Hover
						</button>
						<button
							type="button"
							disabled
							className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-semibold text-white opacity-40"
							style={{ backgroundColor: "var(--primary-600)" }}
						>
							Disabled
						</button>
					</div>
					<div className="mt-3 flex flex-wrap items-center gap-3">
						<button
							type="button"
							className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
							style={{
								backgroundColor: "var(--secondary-600, var(--primary-300))",
							}}
						>
							Secondary
						</button>
						<button
							type="button"
							className="rounded-lg border px-4 py-2 text-sm font-semibold"
							style={{
								borderColor: "var(--primary-300)",
								color: "var(--primary-800)",
							}}
						>
							Outlined
						</button>
						<button
							type="button"
							className="rounded-lg px-4 py-2 text-sm font-semibold"
							style={{ color: "var(--primary-700)" }}
						>
							Ghost
						</button>
					</div>
				</Card>

				<Card>
					<p className="mb-3 text-xs font-medium text-zinc-500">Form</p>
					<div className="flex flex-col gap-3">
						<input
							type="text"
							placeholder="you@example.com"
							className="rounded-lg border px-3 py-2 text-sm outline-none"
							style={{ borderColor: "var(--primary-300)" }}
						/>
						<div className="flex flex-wrap items-center gap-4 text-sm text-zinc-700">
							<span className="flex items-center gap-2">
								<span
									className="flex h-5 w-5 items-center justify-center rounded text-white"
									style={{ backgroundColor: "var(--primary-600)" }}
								>
									<Icon name="check" />
								</span>
								Checked
							</span>
							<span className="flex items-center gap-2">
								<span
									className="h-5 w-5 rounded border"
									style={{ borderColor: "var(--primary-400)" }}
								/>
								Off
							</span>
							<span className="flex items-center gap-2">
								<span
									className="flex h-5 w-5 items-center justify-center rounded-full border"
									style={{ borderColor: "var(--primary-500)" }}
								>
									<span
										className="h-2.5 w-2.5 rounded-full"
										style={{ backgroundColor: "var(--primary-600)" }}
									/>
								</span>
								Radio
							</span>
							<span
								className="relative inline-flex h-6 w-11 items-center rounded-full px-0.5"
								style={{ backgroundColor: "var(--primary-600)" }}
							>
								<span className="h-5 w-5 translate-x-5 rounded-full bg-white" />
							</span>
						</div>
					</div>
				</Card>

				<Card>
					<p className="mb-3 text-xs font-medium text-zinc-500">Badges & nav</p>
					<div className="flex flex-wrap gap-2">
						{["Primary", "Secondary", "Solid"].map((label, i) => (
							<span
								key={label}
								className="rounded-full px-2.5 py-0.5 text-xs font-medium"
								style={
									i === 2
										? { backgroundColor: "var(--primary-600)", color: "#fff" }
										: {
												backgroundColor: `var(--${i === 1 ? "secondary" : "primary"}-100, var(--primary-100))`,
												color: `var(--${i === 1 ? "secondary" : "primary"}-800, var(--primary-800))`,
											}
								}
							>
								{label}
							</span>
						))}
					</div>
					<div
						className="mt-3 flex items-center justify-between rounded-full px-5 py-2.5"
						style={{ backgroundColor: "var(--primary-100)" }}
					>
						<span
							className="flex h-8 w-8 items-center justify-center rounded-full text-white"
							style={{ backgroundColor: "var(--primary-700)" }}
						>
							<Icon name="home" />
						</span>
						<span style={{ color: "var(--primary-900)" }}>
							<Icon name="search" />
						</span>
						<span style={{ color: "var(--primary-900)" }}>
							<Icon name="user" />
						</span>
					</div>
				</Card>

				<Card>
					<p className="mb-3 text-xs font-medium text-zinc-500">Surfaces</p>
					<div
						className="flex items-center gap-2 rounded-lg px-3 py-2.5"
						style={{
							backgroundColor: "var(--primary-100)",
							color: "var(--primary-400)",
						}}
					>
						<Icon name="search" />
						<span className="text-sm">Search</span>
					</div>
					<div
						className="mt-3 rounded-lg border p-3 text-sm"
						style={{
							borderColor: "var(--primary-200)",
							backgroundColor: "var(--primary-50)",
							color: "var(--primary-900)",
						}}
					>
						Alert — uses the primary surface and text roles.
					</div>
				</Card>
			</div>
		</Section>
	);
}

// ── Foundations ───────────────────────────────────────────────────────────────

const SPACING = [4, 8, 12, 16, 24, 32, 48];
const RADII: ReadonlyArray<{ label: string; r: string }> = [
	{ label: "sm", r: "6px" },
	{ label: "md", r: "10px" },
	{ label: "lg", r: "16px" },
	{ label: "xl", r: "24px" },
	{ label: "full", r: "9999px" },
];
const SHADOWS: ReadonlyArray<{ label: string; cls: string }> = [
	{ label: "sm", cls: "shadow-sm" },
	{ label: "md", cls: "shadow-md" },
	{ label: "lg", cls: "shadow-lg" },
	{ label: "xl", cls: "shadow-xl" },
];

function FoundationsSection(): JSX.Element {
	return (
		<Section
			title="Foundations"
			caption="static reference — not yet token-driven"
		>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card>
					<p className="mb-3 text-xs font-medium text-zinc-500">Spacing</p>
					<div className="flex flex-col gap-2">
						{SPACING.map((s) => (
							<div key={s} className="flex items-center gap-3">
								<span className="w-8 shrink-0 font-mono text-[11px] text-zinc-400">
									{s}
								</span>
								<span
									className="h-3 rounded"
									style={{ width: s, backgroundColor: "var(--primary-500)" }}
								/>
							</div>
						))}
					</div>
				</Card>

				<Card>
					<p className="mb-3 text-xs font-medium text-zinc-500">Radius</p>
					<div className="flex flex-wrap gap-3">
						{RADII.map(({ label, r }) => (
							<div key={label} className="flex flex-col items-center gap-1">
								<span
									className="h-12 w-12"
									style={{
										borderRadius: r,
										backgroundColor: "var(--primary-300)",
									}}
								/>
								<span className="font-mono text-[10px] text-zinc-400">
									{label}
								</span>
							</div>
						))}
					</div>
				</Card>

				<Card>
					<p className="mb-3 text-xs font-medium text-zinc-500">Elevation</p>
					<div className="flex flex-wrap gap-4 py-1">
						{SHADOWS.map(({ label, cls }) => (
							<div key={label} className="flex flex-col items-center gap-1">
								<span className={`h-12 w-12 rounded-lg bg-white ${cls}`} />
								<span className="font-mono text-[10px] text-zinc-400">
									{label}
								</span>
							</div>
						))}
					</div>
				</Card>
			</div>
		</Section>
	);
}

/**
 * Design-system board: a single informative reference for the live tokens —
 * color scales with WCAG contrast, the full type scale, components & form
 * states, and foundation scales. Colors flow through `var(--…)`; type uses the
 * typography tokens.
 */
export function DesignSystemPreview({
	typography,
	palettes,
}: PreviewProps): JSX.Element {
	return (
		<div
			className="flex flex-col gap-8 rounded-2xl p-5 text-zinc-900 dark:text-zinc-900"
			style={{ backgroundColor: "var(--primary-100)" }}
		>
			<ColorsSection palettes={palettes} />
			<TypeSection typography={typography} />
			<ComponentsSection />
			<FoundationsSection />
		</div>
	);
}
