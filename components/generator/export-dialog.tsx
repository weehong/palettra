"use client";

import type { JSX } from "react";
import { useMemo, useState } from "react";

import type { Palette } from "@/lib/color";
import {
	toCssVars,
	toFigmaTokens,
	toHexList,
	toTailwindV3,
	toTailwindV4Oklch,
} from "@/lib/color";
import type { Typography } from "@/lib/typography";
import type { StitchSpec } from "@/lib/stitch";
import { serializeStitchSpec } from "@/lib/stitch";
import { useCopyToClipboard } from "@/components/generator/use-copy-to-clipboard";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trackEvent } from "@/lib/analytics";

type TabKey = "v4" | "v3" | "css" | "hex" | "figma" | "stitch";

type ExportDialogProps = {
	palettes: ReadonlyArray<Palette>;
	typography: Typography;
	stitchSpec?: StitchSpec | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const BASE_TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
	{ key: "v4", label: "Tailwind v4" },
	{ key: "v3", label: "Tailwind v3" },
	{ key: "css", label: "CSS variables" },
	{ key: "hex", label: "HEX" },
	{ key: "figma", label: "Figma (tokens)" },
];

const STITCH_TAB = { key: "stitch" as const, label: "Stitch (.md)" };

/** Filename + MIME type used when downloading each export format. */
const DOWNLOADS: Readonly<Record<TabKey, { filename: string; mime: string }>> =
	{
		v4: { filename: "theme.css", mime: "text/css" },
		v3: { filename: "tailwind.config.js", mime: "text/javascript" },
		css: { filename: "theme.css", mime: "text/css" },
		hex: { filename: "palette.txt", mime: "text/plain" },
		figma: { filename: "figma-tokens.json", mime: "application/json" },
		stitch: { filename: "design-spec.md", mime: "text/markdown" },
	};

function buildOutput(
	palettes: ReadonlyArray<Palette>,
	typography: Typography,
	stitchSpec: StitchSpec | null | undefined,
	tab: TabKey,
): string {
	switch (tab) {
		case "v4":
			return toTailwindV4Oklch(palettes);
		case "v3":
			return toTailwindV3(palettes);
		case "css":
			return toCssVars(palettes);
		case "hex":
			return toHexList(palettes);
		case "figma":
			return toFigmaTokens(palettes, typography);
		case "stitch":
			return stitchSpec ? serializeStitchSpec(stitchSpec) : "";
	}
}

/** Trigger a client-side file download of `text` under `filename`. */
function downloadText(text: string, filename: string, mime: string): void {
	const blob = new Blob([text], { type: mime });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

/** Accessible export modal. */
export function ExportDialog({
	palettes,
	typography,
	stitchSpec,
	open,
	onOpenChange,
}: ExportDialogProps): JSX.Element {
	const [tab, setTab] = useState<TabKey>("v4");
	const { copiedKey, copy } = useCopyToClipboard();

	const tabs = stitchSpec ? [...BASE_TABS, STITCH_TAB] : BASE_TABS;

	const output = useMemo(
		() => buildOutput(palettes, typography, stitchSpec, tab),
		[palettes, typography, stitchSpec, tab],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-2xl"
				aria-describedby={undefined}
			>
				<DialogHeader>
					<DialogTitle>Export theme</DialogTitle>
				</DialogHeader>

				<Tabs
					value={tab}
					onValueChange={(value) => setTab(value as TabKey)}
					className="min-w-0"
				>
					<TabsList className="flex w-full flex-wrap items-stretch justify-start gap-1 rounded-none bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto">
						{tabs.map(({ key, label }) => (
							<TabsTrigger
								key={key}
								value={key}
								className="h-10 flex-none rounded-md px-3 text-base font-medium text-muted-foreground transition-colors after:hidden hover:bg-muted hover:text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none dark:text-muted-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
							>
								{label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				<pre className="bg-foreground text-background min-h-0 max-h-none max-w-full overflow-auto rounded-lg p-4 font-mono text-sm leading-relaxed">
					<code>{output}</code>
				</pre>

				<div className="flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => {
							const { filename, mime } = DOWNLOADS[tab];
							downloadText(output, filename, mime);
							trackEvent("export_downloaded", { format: tab });
						}}
					>
						Download
					</Button>
					<Button
						onClick={() => {
							copy("export", output);
							trackEvent("export_copied", { format: tab });
						}}
					>
						{copiedKey === "export" ? "Copied!" : "Copy"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
