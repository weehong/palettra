import type { JSX } from "react";

const BARS = [
	{ label: "Mon", value: 55 },
	{ label: "Tue", value: 72 },
	{ label: "Wed", value: 48 },
	{ label: "Thu", value: 90 },
	{ label: "Fri", value: 66 },
	{ label: "Sat", value: 80 },
];

// Points for a simple SVG line chart (0–100 viewbox, y inverted below).
const LINE = [10, 40, 25, 55, 45, 75, 60, 88];

/** Data-viz: bar chart, SVG line chart, and a conic-gradient donut. */
export function ChartsPreview(): JSX.Element {
	const linePoints = LINE.map(
		(value, index) =>
			`${(index / (LINE.length - 1)) * 100},${100 - value}`,
	).join(" ");

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
				<p className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
					Bar chart
				</p>
				<div className="flex h-40 items-end gap-3">
					{BARS.map((bar) => (
						<div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
							<div
								className="w-full rounded-t"
								style={{
									height: `${bar.value}%`,
									backgroundColor: "var(--primary-500)",
								}}
							/>
							<span className="text-xs text-zinc-500">{bar.label}</span>
						</div>
					))}
				</div>
			</div>

			<div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
				<p className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
					Trend
				</p>
				<svg
					viewBox="0 0 100 100"
					preserveAspectRatio="none"
					className="h-40 w-full"
					role="img"
					aria-label="Line chart"
				>
					<polyline
						points={linePoints}
						fill="none"
						stroke="var(--primary-500)"
						strokeWidth="2"
						vectorEffect="non-scaling-stroke"
					/>
					<polyline
						points={`0,100 ${linePoints} 100,100`}
						fill="var(--primary-100)"
						opacity="0.6"
					/>
				</svg>
			</div>

			<div className="flex items-center gap-6 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800 lg:col-span-2">
				<div
					className="h-32 w-32 shrink-0 rounded-full"
					style={{
						background:
							"conic-gradient(var(--primary-600) 0% 45%, var(--primary-400) 45% 70%, var(--primary-200) 70% 100%)",
					}}
				>
					<div className="flex h-full w-full items-center justify-center">
						<div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-950" />
					</div>
				</div>
				<ul className="flex flex-col gap-2 text-sm">
					{[
						{ label: "Direct", shade: "var(--primary-600)", pct: "45%" },
						{ label: "Referral", shade: "var(--primary-400)", pct: "25%" },
						{ label: "Organic", shade: "var(--primary-200)", pct: "30%" },
					].map((item) => (
						<li key={item.label} className="flex items-center gap-2">
							<span
								className="inline-block h-3 w-3 rounded-sm"
								style={{ backgroundColor: item.shade }}
							/>
							<span className="text-zinc-600 dark:text-zinc-300">
								{item.label}
							</span>
							<span className="ml-auto font-medium text-zinc-900 dark:text-zinc-100">
								{item.pct}
							</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
