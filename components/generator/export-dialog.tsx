"use client";

import type { JSX } from "react";
import { useMemo, useState } from "react";

import type { Palette, Shade } from "@/lib/color";
import {
	toCssVars,
	toFigmaTokens,
	toHexList,
	toTailwindV3,
	toTailwindV4Oklch,
	withUniqueSlugs,
} from "@/lib/color";
import type { Typography } from "@/lib/typography";
import type { ColorRole } from "@/lib/theme";
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
import { trackEventOnce } from "@/lib/analytics";
import { rememberPaletteHref } from "@/lib/recent-palette";

type TabKey = "v4" | "v3" | "css" | "hex" | "figma" | "stitch";

type ExportDialogProps = {
	palettes: ReadonlyArray<Palette>;
	roles: ReadonlyArray<ColorRole>;
	typography: Typography;
	stitchSpec?: StitchSpec | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	semanticNamesLocked: boolean;
	onSemanticNameChange: (id: string, shade: Shade, name: string) => void;
	onLockSemanticNames: () => void;
	shareHref: string;
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
	roles: ReadonlyArray<ColorRole>,
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
			return toFigmaTokens(
				palettes,
				typography,
				roles.map((role) => role.semanticNames ?? {}),
			);
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
	roles,
	typography,
	stitchSpec,
	open,
	onOpenChange,
	semanticNamesLocked,
	onSemanticNameChange,
	onLockSemanticNames,
	shareHref,
}: ExportDialogProps): JSX.Element {
	const [tab, setTab] = useState<TabKey>("v4");
	const { copiedKey, copy } = useCopyToClipboard();

	const tabs = stitchSpec ? [...BASE_TABS, STITCH_TAB] : BASE_TABS;

	const output = useMemo(
		() => buildOutput(palettes, typography, stitchSpec, tab, roles),
		[palettes, typography, stitchSpec, tab, roles],
	);
	const sluggedPalettes = withUniqueSlugs(palettes);
	const primitiveNames = new Set(sluggedPalettes.map(({ slug }) => slug));
	const semanticEntries = roles.flatMap((role, roleIndex) =>
		Object.entries(role.semanticNames ?? {}).map(([shade, name]) => ({
			role,
			roleIndex,
			shade: Number(shade) as Shade,
			name,
		})),
	);
	const normalizedNames = semanticEntries.map(({ name }) => name.trim());
	const validationError = semanticEntries.find(({ name }) => {
		const trimmed = name.trim();
		return !trimmed || trimmed.startsWith("$") || /[.{}]/.test(trimmed);
	})
		? "Names cannot be empty, start with $, or contain periods or braces."
		: new Set(normalizedNames).size !== normalizedNames.length
			? "Semantic names must be unique."
			: normalizedNames.some(
						(name) =>
							primitiveNames.has(name) ||
							["fontFamily", "fontSize", "fontWeight", "lineHeight"].includes(
								name,
							),
				  )
				? "A semantic name conflicts with an exported token group."
				: null;
	const figmaExportDisabled =
		tab === "figma" && (!semanticNamesLocked || Boolean(validationError));

	function trackActivation(method: "copy" | "download"): void {
		trackEventOnce("palette-activated", "palette_activated", {
			format: tab,
			method,
			role_count: palettes.length,
		});
		rememberPaletteHref(shareHref);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-2xl"
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
								className="text-muted-foreground hover:bg-muted hover:text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:text-muted-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground h-10 flex-none rounded-md px-3 text-base font-medium transition-colors after:hidden group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none dark:data-[state=active]:border-transparent"
							>
								{label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				{tab === "figma" ? (
					<section
						aria-label="Semantic token names"
						className="border-input max-h-52 space-y-3 overflow-auto rounded-lg border p-3"
					>
						<div className="flex items-center justify-between gap-3">
							<div>
								<h3 className="font-semibold">Semantic names</h3>
								<p className="text-muted-foreground text-sm">
									Review aliases before copying or downloading.
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								disabled={Boolean(validationError)}
								onClick={onLockSemanticNames}
							>
								{semanticNamesLocked ? "Names locked" : "Lock names"}
							</Button>
						</div>
						{semanticEntries.length ? (
							semanticEntries.map(({ role, roleIndex, shade, name }) => (
								<label
									key={`${role.id}-${shade}`}
									className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm"
								>
									<input
										value={name}
										onChange={(event) =>
											onSemanticNameChange(role.id, shade, event.target.value)
										}
										aria-label={`${role.name} ${shade} semantic name`}
										className="border-input bg-background rounded-md border px-2 py-1.5"
									/>
									<span className="text-muted-foreground font-mono">
										→ {sluggedPalettes[roleIndex]?.slug}/{shade}
									</span>
								</label>
							))
						) : (
							<p className="text-muted-foreground text-sm">
								Add semantic names beneath palette swatches, then lock this
								review.
							</p>
						)}
						{validationError ? (
							<p role="alert" className="text-destructive text-sm">
								{validationError}
							</p>
						) : null}
					</section>
				) : null}

				<pre className="bg-foreground text-background max-h-none min-h-0 max-w-full flex-1 overflow-auto rounded-lg p-4 font-mono text-sm leading-relaxed">
					<code>{output}</code>
				</pre>

				<div className="flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => {
							const absoluteHref = new URL(shareHref, window.location.origin)
								.href;
							void copy("share", absoluteHref);
							rememberPaletteHref(shareHref);
							trackEvent("share_copied", { location: "export_dialog" });
						}}
					>
						{copiedKey === "share" ? "Link copied!" : "Copy share link"}
					</Button>
					<Button
						variant="outline"
						disabled={figmaExportDisabled}
						onClick={() => {
							const { filename, mime } = DOWNLOADS[tab];
							downloadText(output, filename, mime);
							trackEvent("export_downloaded", { format: tab });
							trackActivation("download");
						}}
					>
						Download
					</Button>
					<Button
						disabled={figmaExportDisabled}
						onClick={() => {
							void copy("export", output);
							trackEvent("export_copied", { format: tab });
							trackActivation("copy");
						}}
					>
						{copiedKey === "export" ? "Copied!" : "Copy"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
