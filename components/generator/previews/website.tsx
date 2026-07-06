import type { JSX } from "react";

const NAV = ["Product", "Pricing", "Docs", "Blog"];

/** Marketing landing page: nav, hero with CTAs, feature row, and footer. */
export function WebsitePreview(): JSX.Element {
	return (
		<div className="overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
			<header
				className="flex items-center justify-between px-6 py-4"
				style={{ backgroundColor: "var(--primary-50)" }}
			>
				<div className="flex items-center gap-2">
					<span
						className="h-6 w-6 rounded-md"
						style={{ backgroundColor: "var(--primary-600)" }}
					/>
					<span
						className="text-sm font-bold"
						style={{ color: "var(--primary-900)" }}
					>
						Northwind
					</span>
				</div>
				<nav className="hidden gap-5 text-sm font-medium sm:flex">
					{NAV.map((item) => (
						<span key={item} style={{ color: "var(--primary-800)" }}>
							{item}
						</span>
					))}
				</nav>
				<button
					type="button"
					className="rounded-md px-3 py-1.5 text-sm font-semibold text-white"
					style={{ backgroundColor: "var(--primary-600)" }}
				>
					Sign up
				</button>
			</header>

			<div className="flex flex-col items-center gap-5 px-6 py-14 text-center">
				<span
					className="rounded-full px-3 py-1 text-xs font-medium"
					style={{
						backgroundColor: "var(--primary-100)",
						color: "var(--primary-800)",
					}}
				>
					New — v2 is here
				</span>
				<h1 className="max-w-xl text-4xl font-bold tracking-tight">
					Ship your product with a palette that works everywhere.
				</h1>
				<p className="max-w-md text-zinc-500">
					A complete color system, generated from a single brand color and ready
					for production.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<button
						type="button"
						className="rounded-md px-5 py-2.5 text-sm font-semibold text-white"
						style={{ backgroundColor: "var(--primary-600)" }}
					>
						Get started
					</button>
					<button
						type="button"
						className="rounded-md border px-5 py-2.5 text-sm font-semibold"
						style={{
							borderColor: "var(--primary-300)",
							color: "var(--primary-700)",
						}}
					>
						Live demo
					</button>
				</div>
			</div>

			<footer
				className="px-6 py-4 text-center text-xs"
				style={{
					backgroundColor: "var(--primary-900)",
					color: "var(--primary-100)",
				}}
			>
				© 2026 Northwind. All rights reserved.
			</footer>
		</div>
	);
}
