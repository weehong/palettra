import type { JSX } from "react";

import { defaultTheme } from "@/lib/theme";
import { PaletteGenerator } from "@/components/generator/palette-generator";

export default function Home(): JSX.Element {
	return (
		<main className="mx-auto flex min-h-0 w-full max-w-none flex-1 flex-col gap-3 overflow-hidden px-5 py-4">
			{/* AI theme + Apply to site temporarily withdrawn: aiEnabled/
			    aiDefaultModel/applyToSiteEnabled intentionally not passed. */}
			<PaletteGenerator initialTheme={defaultTheme()} />
		</main>
	);
}
