import type { JSX } from "react";

import { defaultTheme } from "@/lib/theme";
import { PaletteGenerator } from "@/components/generator/palette-generator";

export default function Home(): JSX.Element {
	return (
		<main
			data-generator-page
			className="mx-auto flex w-full max-w-none flex-none flex-col gap-3 overflow-visible px-5 py-4 md:min-h-0 md:flex-1 md:overflow-hidden"
		>
			<section className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1 md:sr-only">
				<h1 className="text-foreground text-lg font-semibold">
					Generate a Tailwind v4 OKLCH color system from one color
				</h1>
				<p className="text-muted-foreground text-sm">
					Preview WCAG contrast, then export for Tailwind v3, v4, CSS, or Figma.
				</p>
			</section>
			{/* AI theme + Apply to site temporarily withdrawn: aiEnabled/
			    aiDefaultModel/applyToSiteEnabled intentionally not passed. */}
			<PaletteGenerator initialTheme={defaultTheme()} />
		</main>
	);
}
