import type { JSX } from "react";

import { generateTypeScale } from "@/lib/typography";
import type { PreviewProps } from "@/components/generator/previews/index";

const HEADING_STEPS = ["4xl", "3xl", "2xl", "xl", "lg"] as const;

/**
 * Typography specimen built from the live typography tokens: a heading scale in
 * the heading family, body copy, and a mono sample. Accent rule uses the
 * palette.
 */
export function TypographyPreview({ typography }: PreviewProps): JSX.Element {
	const scale = generateTypeScale(typography.baseSize, typography.ratio);
	const heading = `${typography.fonts.heading}, system-ui, sans-serif`;
	const serif = `${typography.fonts.serif}, Georgia, serif`;
	const mono = `${typography.fonts.mono}, ui-monospace, monospace`;

	return (
		<div className="flex flex-col gap-8 text-zinc-900 dark:text-zinc-100">
			<section className="flex flex-col gap-3" style={{ fontFamily: heading }}>
				<span
					className="text-xs font-semibold uppercase tracking-wide"
					style={{ color: "var(--primary-600)" }}
				>
					Heading scale · {typography.fonts.heading}
				</span>
				{HEADING_STEPS.map((step) => (
					<div key={step} className="flex items-baseline gap-3">
						<span className="w-10 shrink-0 font-mono text-xs text-zinc-400">
							{step}
						</span>
						<span
							className="font-semibold leading-tight"
							style={{ fontSize: `${scale[step]}px` }}
						>
							The quick brown fox
						</span>
					</div>
				))}
			</section>

			<section className="flex flex-col gap-2">
				<span
					className="text-xs font-semibold uppercase tracking-wide"
					style={{ color: "var(--primary-600)" }}
				>
					Body · {typography.fonts.serif}
				</span>
				<p
					className="max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-300"
					style={{ fontFamily: serif, fontSize: `${scale.base}px` }}
				>
					Good typography establishes hierarchy and rhythm. This paragraph is set
					at the base size ({scale.base}px) so you can judge measure and
					line-height against the heading scale above.
				</p>
			</section>

			<section className="flex flex-col gap-2">
				<span
					className="text-xs font-semibold uppercase tracking-wide"
					style={{ color: "var(--primary-600)" }}
				>
					Mono · {typography.fonts.mono}
				</span>
				<code
					className="rounded-md px-3 py-2 text-sm"
					style={{
						fontFamily: mono,
						backgroundColor: "var(--primary-50)",
						color: "var(--primary-900)",
					}}
				>
					const palette = generatePalette(&quot;#a543bc&quot;);
				</code>
			</section>
		</div>
	);
}
