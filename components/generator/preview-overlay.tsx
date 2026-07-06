"use client";

import type { CSSProperties, JSX } from "react";
import { useEffect } from "react";

import type { Palette } from "@/lib/color";
import { previewThemeVars } from "@/lib/color";
import type { Typography } from "@/lib/typography";
import {
	DEFAULT_PREVIEW_KEY,
	PREVIEW_TEMPLATES,
} from "@/components/generator/previews";
import { Button } from "@/components/ui/button";

type PreviewOverlayProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	cssVars: Record<string, string>;
	typography: Typography;
	palettes: ReadonlyArray<Palette>;
};

/** Overlay covering the generator workspace with the Design system preview. */
export function PreviewOverlay({
	open,
	onOpenChange,
	cssVars,
	typography,
	palettes,
}: PreviewOverlayProps): JSX.Element | null {
	useEffect(() => {
		if (!open) {
			return;
		}
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.key === "Escape") {
				onOpenChange(false);
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open, onOpenChange]);

	if (!open) {
		return null;
	}

	// Merge the caller's vars (role scales + any imported Stitch MD3 tokens like
	// --surface/--on-surface) with positional aliases so templates'
	// --secondary/--tertiary/--neutral resolve to the 2nd/3rd/4th roles regardless
	// of how they were named. Aliases win for the semantic keys.
	const themeStyle = {
		...cssVars,
		...previewThemeVars(palettes),
	} as unknown as CSSProperties;

	const template =
		PREVIEW_TEMPLATES.find((entry) => entry.key === DEFAULT_PREVIEW_KEY) ??
		PREVIEW_TEMPLATES[0];
	const Template = template.Component;

	return (
		<div
			data-testid="preview-overlay"
			className="absolute inset-0 z-20 flex flex-col bg-background text-foreground"
			style={themeStyle}
		>
			<div className="flex items-center gap-3 border-b border-border px-4 py-3">
				<h2 className="shrink-0 text-base font-semibold">Preview</h2>

				<div
					role="tablist"
					aria-label="Preview template"
					className="flex flex-1 gap-1 overflow-x-auto"
				>
					<button
						type="button"
						role="tab"
						aria-selected="true"
						className="inline-flex h-10 shrink-0 items-center rounded-md bg-primary px-3 text-base font-medium text-primary-foreground"
					>
						{template.label}
					</button>
				</div>

				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => onOpenChange(false)}
					aria-label="Close preview"
					className="shrink-0 text-muted-foreground"
				>
					✕
				</Button>
			</div>

			<div className="flex-1 overflow-auto p-6">
				<div className="mx-auto w-full max-w-5xl">
					<Template typography={typography} palettes={palettes} />
				</div>
			</div>
		</div>
	);
}
