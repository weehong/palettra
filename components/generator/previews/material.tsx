import type { JSX } from "react";

/**
 * Material Design 3 surface/component showcase. Reads the flat MD3 tokens an
 * imported Stitch spec injects (`var(--surface)`, `var(--on-surface)`,
 * `var(--primary)`, …) rather than the role scales, with sensible fallbacks so
 * it still renders before any spec is imported. Colors come from CSS vars (not
 * props) so it also works inside the script-less AI preview iframe.
 */
export function MaterialPreview(): JSX.Element {
	const radius = "var(--radius, 0.5rem)";
	return (
		<div
			className="flex flex-col gap-6 rounded-xl p-6"
			style={{
				backgroundColor: "var(--surface, #fff)",
				color: "var(--on-surface, #1c1b1b)",
			}}
		>
			<header
				className="flex items-center justify-between rounded-lg px-4 py-3"
				style={{
					backgroundColor: "var(--surface-container, #eee)",
					color: "var(--on-surface, #1c1b1b)",
				}}
			>
				<span className="text-sm font-semibold">Material surfaces</span>
				<span
					className="rounded-full px-2.5 py-0.5 text-xs font-medium"
					style={{
						backgroundColor: "var(--primary, #6750a4)",
						color: "var(--on-primary, #fff)",
					}}
				>
					Badge
				</span>
			</header>

			<section className="flex flex-col gap-3">
				<h3
					className="text-xs font-semibold uppercase tracking-wide"
					style={{ color: "var(--on-surface-variant, #49454f)" }}
				>
					Buttons
				</h3>
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						className="px-5 py-2 text-sm font-semibold"
						style={{
							backgroundColor: "var(--primary, #6750a4)",
							color: "var(--on-primary, #fff)",
							borderRadius: "9999px",
						}}
					>
						Filled
					</button>
					<button
						type="button"
						className="px-5 py-2 text-sm font-semibold"
						style={{
							backgroundColor: "var(--secondary-container, #e8def8)",
							color: "var(--on-secondary-container, #1d192b)",
							borderRadius: "9999px",
						}}
					>
						Tonal
					</button>
					<button
						type="button"
						className="px-5 py-2 text-sm font-semibold"
						style={{
							border: "1px solid var(--outline, #79747e)",
							color: "var(--primary, #6750a4)",
							borderRadius: "9999px",
						}}
					>
						Outlined
					</button>
					<button
						type="button"
						className="px-3 py-2 text-sm font-semibold"
						style={{ color: "var(--primary, #6750a4)" }}
					>
						Text
					</button>
				</div>
			</section>

			<section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{[
					{ label: "Lowest", token: "--surface-container-lowest, #fff" },
					{ label: "Container", token: "--surface-container, #f3f3f3" },
					{ label: "Highest", token: "--surface-container-highest, #e6e6e6" },
				].map(({ label, token }) => (
					<div
						key={label}
						className="flex flex-col gap-2 p-4"
						style={{
							backgroundColor: `var(${token})`,
							color: "var(--on-surface, #1c1b1b)",
							borderRadius: radius,
							border: "1px solid var(--outline-variant, #cac4d0)",
						}}
					>
						<span className="text-sm font-semibold">{label}</span>
						<span
							className="text-xs"
							style={{ color: "var(--on-surface-variant, #49454f)" }}
						>
							A tonal surface layer used to convey elevation.
						</span>
					</div>
				))}
			</section>

			<section className="flex flex-col gap-3">
				<h3
					className="text-xs font-semibold uppercase tracking-wide"
					style={{ color: "var(--on-surface-variant, #49454f)" }}
				>
					Input & chips
				</h3>
				<div className="flex max-w-sm flex-col gap-3">
					<div
						className="flex flex-col gap-1 px-3 py-2"
						style={{
							border: "1px solid var(--outline, #79747e)",
							borderRadius: radius,
						}}
					>
						<span
							className="text-[11px]"
							style={{ color: "var(--primary, #6750a4)" }}
						>
							Label
						</span>
						<span className="text-sm" style={{ color: "var(--on-surface, #1c1b1b)" }}>
							Input value
						</span>
					</div>
					<div className="flex flex-wrap gap-2">
						{["Assist", "Filter", "Suggestion"].map((chip) => (
							<span
								key={chip}
								className="px-3 py-1 text-xs font-medium"
								style={{
									border: "1px solid var(--outline, #79747e)",
									color: "var(--on-surface, #1c1b1b)",
									borderRadius: "9999px",
								}}
							>
								{chip}
							</span>
						))}
					</div>
				</div>
			</section>

			<section
				className="flex items-center gap-3 p-4"
				style={{
					backgroundColor: "var(--inverse-surface, #313033)",
					color: "var(--inverse-on-surface, #f4eff4)",
					borderRadius: radius,
				}}
			>
				<span className="text-sm">Inverse surface (snackbar)</span>
				<span
					className="ml-auto text-sm font-semibold"
					style={{ color: "var(--inverse-primary, #d0bcff)" }}
				>
					Action
				</span>
			</section>
		</div>
	);
}
