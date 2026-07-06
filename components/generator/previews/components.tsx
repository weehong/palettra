import type { JSX } from "react";

import { slugify } from "@/lib/color";
import type { PreviewProps } from "@/components/generator/previews";

const STATUS_SLUGS = ["success", "warning", "error"] as const;

type StatusSlug = (typeof STATUS_SLUGS)[number];

const STATUS_COPY: Readonly<Record<StatusSlug, { label: string; message: string }>> =
	{
		success: { label: "Success", message: "Changes saved successfully." },
		warning: { label: "Warning", message: "Your trial ends in 3 days." },
		error: { label: "Error", message: "Something went wrong. Try again." },
	};

/**
 * Component gallery: buttons, inputs, badges, a toggle, and an alert. Neutral
 * zinc chrome with palette accents pulled from `var(--primary-*)` (with the
 * secondary/tertiary roles falling back to primary when absent). Status
 * alerts/badges appear once success/warning/error scales exist.
 */
export function ComponentsPreview({ palettes }: PreviewProps): JSX.Element {
	const slugs = new Set(palettes.map((palette) => slugify(palette.name)));
	const statuses = STATUS_SLUGS.filter((slug) => slugs.has(slug));
	return (
		<div className="flex flex-col gap-8 text-zinc-900 dark:text-zinc-100">
			<section className="flex flex-col gap-3">
				<h3 className="text-sm font-semibold text-zinc-500">Buttons</h3>
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						className="rounded-md px-4 py-2 text-sm font-semibold text-white"
						style={{ backgroundColor: "var(--primary-600)" }}
					>
						Primary
					</button>
					<button
						type="button"
						className="rounded-md px-4 py-2 text-sm font-semibold"
						style={{
							backgroundColor: "var(--secondary-100, var(--primary-100))",
							color: "var(--secondary-800, var(--primary-800))",
						}}
					>
						Secondary
					</button>
					<button
						type="button"
						className="rounded-md border px-4 py-2 text-sm font-semibold"
						style={{
							borderColor: "var(--primary-300)",
							color: "var(--primary-700)",
						}}
					>
						Outline
					</button>
					<button
						type="button"
						className="rounded-md px-4 py-2 text-sm font-semibold"
						style={{ color: "var(--primary-700)" }}
					>
						Ghost
					</button>
					<a
						href="#preview"
						className="text-sm font-semibold underline-offset-4 hover:underline"
						style={{ color: "var(--primary-600)" }}
					>
						Text link
					</a>
				</div>
			</section>

			<section className="flex flex-col gap-3">
				<h3 className="text-sm font-semibold text-zinc-500">Badges</h3>
				<div className="flex flex-wrap gap-2">
					<span
						className="rounded-full px-2.5 py-0.5 text-xs font-medium"
						style={{
							backgroundColor: "var(--primary-100)",
							color: "var(--primary-800)",
						}}
					>
						Primary
					</span>
					<span
						className="rounded-full px-2.5 py-0.5 text-xs font-medium"
						style={{
							backgroundColor: "var(--secondary-100, var(--primary-100))",
							color: "var(--secondary-800, var(--primary-800))",
						}}
					>
						Secondary
					</span>
					<span
						className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
						style={{ backgroundColor: "var(--primary-600)" }}
					>
						Solid
					</span>
					<span className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
						Neutral
					</span>
				</div>
			</section>

			<section className="flex flex-col gap-3">
				<h3 className="text-sm font-semibold text-zinc-500">Form</h3>
				<div className="flex max-w-sm flex-col gap-3">
					<input
						type="text"
						placeholder="you@example.com"
						className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900"
						style={{ caretColor: "var(--primary-600)" }}
					/>
					<div className="flex items-center gap-3">
						<span
							className="relative inline-flex h-6 w-11 items-center rounded-full px-0.5"
							style={{ backgroundColor: "var(--primary-600)" }}
						>
							<span className="h-5 w-5 translate-x-5 rounded-full bg-white transition" />
						</span>
						<span className="text-sm">Enable notifications</span>
					</div>
				</div>
			</section>

			<section
				className="rounded-lg border p-4"
				style={{
					borderColor: "var(--primary-200)",
					backgroundColor: "var(--primary-50)",
				}}
			>
				<p
					className="text-sm font-medium"
					style={{ color: "var(--primary-900)" }}
				>
					Heads up — this alert uses the primary role for surface and text.
				</p>
			</section>

			{statuses.length > 0 ? (
				<section className="flex flex-col gap-3">
					<h3 className="text-sm font-semibold text-zinc-500">Status</h3>
					<div className="flex flex-wrap gap-2">
						{statuses.map((slug) => (
							<span
								key={slug}
								className="rounded-full px-2.5 py-0.5 text-xs font-medium"
								style={{
									backgroundColor: `var(--${slug}-100)`,
									color: `var(--${slug}-800)`,
								}}
							>
								{STATUS_COPY[slug].label}
							</span>
						))}
					</div>
					<div className="flex flex-col gap-2">
						{statuses.map((slug) => (
							<div
								key={slug}
								className="rounded-lg border p-4"
								style={{
									borderColor: `var(--${slug}-200)`,
									backgroundColor: `var(--${slug}-50)`,
								}}
							>
								<p
									className="text-sm font-medium"
									style={{ color: `var(--${slug}-900)` }}
								>
									{STATUS_COPY[slug].label} — {STATUS_COPY[slug].message}
								</p>
							</div>
						))}
					</div>
				</section>
			) : null}
		</div>
	);
}
