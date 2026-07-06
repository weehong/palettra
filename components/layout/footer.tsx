import type { JSX } from "react";
import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export function Footer(): JSX.Element {
	const year = new Date().getFullYear();

	return (
		<footer className="border-border bg-card text-muted-foreground flex shrink-0 flex-col gap-2 border-t px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
			<p>
				Copyright {year} {siteConfig.name}. All rights reserved.
			</p>
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
		</footer>
	);
}
