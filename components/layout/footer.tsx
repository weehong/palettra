import type { JSX } from "react";
import Link from "next/link";

import { GROWTH_PAGES } from "@/lib/growth-pages";
import { siteConfig } from "@/lib/site-config";

export function Footer(): JSX.Element {
	const year = new Date().getFullYear();

	return (
		<footer className="border-border bg-card text-muted-foreground flex shrink-0 flex-col gap-2 border-t px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
			<p>
				Copyright {year} {siteConfig.name}. All rights reserved.
			</p>
			<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
				<nav
					aria-label="Resources"
					className="flex flex-wrap items-center gap-4"
				>
					{GROWTH_PAGES.map((page) => (
						<Link
							key={page.slug}
							href={`/tools/${page.slug}`}
							className="hover:text-foreground focus-visible:ring-ring font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
						>
							{page.eyebrow}
						</Link>
					))}
				</nav>
				<nav aria-label="Legal" className="flex items-center gap-4">
					<Link
						href="/terms"
						className="hover:text-foreground focus-visible:ring-ring font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
					>
						Terms
					</Link>
					<Link
						href="/privacy"
						className="hover:text-foreground focus-visible:ring-ring font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
					>
						Privacy
					</Link>
				</nav>
			</div>
		</footer>
	);
}
