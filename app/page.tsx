import type { JSX } from "react";

import { defaultTheme } from "@/lib/theme";
import { PaletteGenerator } from "@/components/generator/palette-generator";

export default function Home(): JSX.Element {
	return (
		<main className="mx-auto flex w-full max-w-none flex-none flex-col gap-3 overflow-visible px-5 py-4 md:min-h-0 md:flex-1 md:overflow-hidden">
			{/* AI theme + Apply to site temporarily withdrawn: aiEnabled/
			    aiDefaultModel/applyToSiteEnabled intentionally not passed. */}
			<PaletteGenerator initialTheme={defaultTheme()} />
		</main>
	);
}
