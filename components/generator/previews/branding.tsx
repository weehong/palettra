import type { JSX } from "react";

import { SHADES } from "@/lib/color";

/** Branding board: logo lockups on light/dark, plus the swatch ramp. */
export function BrandingPreview(): JSX.Element {
	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div
					className="flex items-center gap-3 rounded-xl border border-zinc-200 p-8 dark:border-zinc-800"
					style={{ backgroundColor: "var(--primary-50)" }}
				>
					<span
						className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black text-white"
						style={{ backgroundColor: "var(--primary-600)" }}
					>
						N
					</span>
					<span
						className="text-2xl font-black tracking-tight"
						style={{ color: "var(--primary-900)" }}
					>
						Northwind
					</span>
				</div>

				<div
					className="flex items-center gap-3 rounded-xl p-8"
					style={{ backgroundColor: "var(--primary-950)" }}
				>
					<span
						className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black"
						style={{
							backgroundColor: "var(--primary-400)",
							color: "var(--primary-950)",
						}}
					>
						N
					</span>
					<span
						className="text-2xl font-black tracking-tight"
						style={{ color: "var(--primary-50)" }}
					>
						Northwind
					</span>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
				<div className="flex">
					{SHADES.map((shade) => (
						<div
							key={shade}
							className="h-16 flex-1"
							style={{ backgroundColor: `var(--primary-${shade})` }}
						/>
					))}
				</div>
				<div className="flex">
					{SHADES.map((shade) => (
						<span
							key={shade}
							className="flex-1 py-1 text-center text-[10px] text-zinc-500"
						>
							{shade}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
