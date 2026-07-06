import type { JSX } from "react";

const GRADIENTS = [
	{
		name: "Brand",
		css: "linear-gradient(135deg, var(--primary-400), var(--primary-700))",
	},
	{
		name: "Sunrise",
		css: "linear-gradient(135deg, var(--primary-200), var(--primary-500))",
	},
	{
		name: "Deep",
		css: "linear-gradient(135deg, var(--primary-600), var(--primary-950))",
	},
	{
		name: "Duo",
		css: "linear-gradient(135deg, var(--primary-500), var(--secondary-500, var(--primary-300)))",
	},
	{
		name: "Radial",
		css: "radial-gradient(circle at 30% 30%, var(--primary-300), var(--primary-700))",
	},
	{
		name: "Mesh",
		css: "linear-gradient(120deg, var(--primary-100), var(--tertiary-400, var(--primary-400)) 60%, var(--primary-800))",
	},
];

/** Gradient swatches built from across the palette scale and roles. */
export function GradientsPreview(): JSX.Element {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{GRADIENTS.map((gradient) => (
				<div
					key={gradient.name}
					className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
				>
					<div className="h-32 w-full" style={{ background: gradient.css }} />
					<div className="flex items-center justify-between px-4 py-2">
						<span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
							{gradient.name}
						</span>
						<span className="text-xs text-zinc-400">gradient</span>
					</div>
				</div>
			))}
		</div>
	);
}
