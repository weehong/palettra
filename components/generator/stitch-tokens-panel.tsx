"use client";

import type { JSX } from "react";
import Markdown from "react-markdown";
import type { Components } from "react-markdown";

import type { StitchSpec } from "@/lib/stitch";
import { useCopyToClipboard } from "@/components/generator/use-copy-to-clipboard";

/**
 * Tailwind-styled renderers for the brand-notes Markdown. The project has no
 * `@tailwindcss/typography` plugin, so each element is styled here to keep the
 * compact panel look. `react-markdown` does not render raw HTML by default, so
 * the user-pasted prose cannot inject scripts.
 */
const MARKDOWN_COMPONENTS: Components = {
	p: ({ children }) => (
		<p className="text-sm leading-relaxed text-muted-foreground">
			{children}
		</p>
	),
	ul: ({ children }) => (
		<ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted-foreground">
			{children}
		</ul>
	),
	ol: ({ children }) => (
		<ol className="flex list-decimal flex-col gap-1 pl-4 text-sm text-muted-foreground">
			{children}
		</ol>
	),
	li: ({ children }) => <li className="leading-relaxed">{children}</li>,
	strong: ({ children }) => (
		<strong className="font-semibold text-foreground">
			{children}
		</strong>
	),
	em: ({ children }) => <em className="italic">{children}</em>,
	code: ({ children }) => (
		<code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
			{children}
		</code>
	),
	a: ({ children, href }) => (
		<a
			href={href}
			className="underline underline-offset-2"
			target="_blank"
			rel="noreferrer"
		>
			{children}
		</a>
	),
	h3: ({ children }) => (
		<h5 className="text-sm font-semibold text-foreground">
			{children}
		</h5>
	),
	h4: ({ children }) => (
		<h5 className="text-sm font-semibold text-foreground">
			{children}
		</h5>
	),
	h5: ({ children }) => (
		<h5 className="text-sm font-semibold text-foreground">
			{children}
		</h5>
	),
};

type StitchTokensPanelProps = {
	spec: StitchSpec;
};

/**
 * Read-only inspector for an imported Google Stitch spec: the flat Material
 * color tokens, the named type styles, the radius/spacing scales, and the brand
 * prose. It coexists with the role-based palette panels — the role generator is
 * seeded from the spec's anchor colors, while the full token set lives here.
 */
export function StitchTokensPanel({ spec }: StitchTokensPanelProps): JSX.Element {
	const { copiedKey, copy } = useCopyToClipboard();

	const colors = Object.entries(spec.colors);
	const styles = Object.entries(spec.typography);
	const rounded = Object.entries(spec.rounded);
	const spacing = Object.entries(spec.spacing);

	return (
		<section
			aria-label="Stitch design tokens"
			className="flex flex-col gap-6 rounded-xl border border-border p-5"
		>
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="text-base font-semibold text-foreground">
					Material tokens
				</h2>
				{spec.extraFrontmatter.name ? (
					<span className="text-sm text-muted-foreground">
						{String(spec.extraFrontmatter.name)}
					</span>
				) : null}
			</div>

			<div className="flex flex-col gap-2">
				<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Colors ({colors.length})
				</h3>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
					{colors.map(([token, hex]) => (
						<button
							key={token}
							type="button"
							onClick={() => copy(token, hex)}
							title={`Copy ${hex}`}
							className="flex items-center gap-2 rounded-md border border-border p-1.5 text-left hover:bg-muted"
						>
							<span
								className="h-7 w-7 shrink-0 rounded border border-black/5"
								style={{ backgroundColor: hex }}
								aria-hidden="true"
							/>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-xs font-medium">
									{token}
								</span>
								<span className="block truncate font-mono text-xs text-muted-foreground">
									{copiedKey === token ? "Copied!" : hex}
								</span>
							</span>
						</button>
					))}
				</div>
			</div>

			{styles.length > 0 ? (
				<div className="flex flex-col gap-2">
					<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Type styles ({styles.length})
					</h3>
					<div className="flex flex-col divide-y divide-border">
						{styles.map(([name, style]) => (
							<div
								key={name}
								className="flex flex-wrap items-baseline justify-between gap-2 py-2"
							>
								<span
									className="truncate text-foreground"
									style={{
										fontFamily: style.fontFamily,
										fontSize: style.fontSize,
										fontWeight: style.fontWeight as string | undefined,
										lineHeight: style.lineHeight,
										letterSpacing: style.letterSpacing,
									}}
								>
									{name}
								</span>
								<span className="font-mono text-xs text-muted-foreground">
									{[
										style.fontFamily,
										style.fontSize,
										style.fontWeight,
										style.lineHeight ? `lh ${style.lineHeight}` : null,
										style.letterSpacing,
									]
										.filter(Boolean)
										.join(" · ")}
								</span>
							</div>
						))}
					</div>
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				{rounded.length > 0 ? (
					<div className="flex flex-col gap-2">
						<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Radius
						</h3>
						<div className="flex flex-wrap gap-2">
							{rounded.map(([name, value]) => (
								<span
									key={name}
									className="rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground"
								>
									{name}: {value}
								</span>
							))}
						</div>
					</div>
				) : null}

				{spacing.length > 0 ? (
					<div className="flex flex-col gap-2">
						<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Spacing
						</h3>
						<div className="flex flex-wrap gap-2">
							{spacing.map(([name, value]) => (
								<span
									key={name}
									className="rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground"
								>
									{name}: {value}
								</span>
							))}
						</div>
					</div>
				) : null}
			</div>

			{spec.sections.length > 0 ? (
				<details className="flex flex-col gap-2">
					<summary className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Brand notes ({spec.sections.length})
					</summary>
					<div className="mt-2 flex flex-col gap-3">
						{spec.sections.map((section) => (
							<div key={section.heading} className="flex flex-col gap-1">
								<h4 className="text-sm font-semibold text-foreground">
									{section.heading}
								</h4>
								<div className="flex flex-col gap-2">
									<Markdown components={MARKDOWN_COMPONENTS}>
										{section.body}
									</Markdown>
								</div>
							</div>
						))}
					</div>
				</details>
			) : null}
		</section>
	);
}
