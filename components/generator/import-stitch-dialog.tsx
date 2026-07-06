"use client";

import type { JSX } from "react";
import { useMemo, useState } from "react";

import type { StitchSpec } from "@/lib/stitch";
import { parseStitchSpec } from "@/lib/stitch";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ImportStitchDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onImportStitch: (spec: StitchSpec) => void;
};

type ParseResult = { spec: StitchSpec | null; error: string | null };

/** Parse without throwing; an empty or malformed paste yields a null spec. */
function safeParse(value: string): ParseResult {
	if (value.trim().length === 0) {
		return { spec: null, error: null };
	}
	try {
		const spec = parseStitchSpec(value);
		const tokenCount =
			Object.keys(spec.colors).length + Object.keys(spec.typography).length;
		if (tokenCount === 0) {
			return {
				spec: null,
				error: "No color or typography tokens found in the frontmatter.",
			};
		}
		return { spec, error: null };
	} catch {
		return { spec: null, error: "Could not parse the YAML frontmatter." };
	}
}

const KEY_TOKENS = [
	"primary",
	"secondary",
	"tertiary",
	"error",
	"surface",
	"on-surface",
	"surface-container-high",
	"outline",
] as const;

/**
 * Paste a Google Stitch design spec (Markdown with YAML frontmatter) and import
 * it natively. The spec is parsed live for a validation summary; importing is
 * disabled until a spec with at least one token is found.
 */
export function ImportStitchDialog({
	open,
	onOpenChange,
	onImportStitch,
}: ImportStitchDialogProps): JSX.Element {
	const [value, setValue] = useState<string>("");

	const { spec, error } = useMemo(() => safeParse(value), [value]);

	function handleImport(): void {
		if (!spec) {
			return;
		}
		onImportStitch(spec);
		onOpenChange(false);
		setValue("");
	}

	const colorCount = spec ? Object.keys(spec.colors).length : 0;
	const styleCount = spec ? Object.keys(spec.typography).length : 0;
	const swatches = spec
		? KEY_TOKENS.filter((token) => spec.colors[token]).map((token) => ({
				token,
				hex: spec.colors[token],
			}))
		: [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Import Stitch spec</DialogTitle>
				</DialogHeader>

				<div className="flex min-h-[3rem] flex-col gap-2">
					{spec ? (
						<>
							<p className="text-muted-foreground text-sm">
								{colorCount} color tokens · {styleCount} type styles ·{" "}
								{Object.keys(spec.rounded).length} radius ·{" "}
								{Object.keys(spec.spacing).length} spacing ·{" "}
								{spec.sections.length} prose sections
							</p>
							<div className="flex flex-wrap gap-2">
								{swatches.map(({ token, hex }) => (
									<span
										key={token}
										className="border-border flex items-center gap-1.5 rounded-md border py-0.5 pr-2 pl-0.5 text-xs"
										title={token}
									>
										<span
											className="h-5 w-5 rounded"
											style={{ backgroundColor: hex }}
											aria-hidden="true"
										/>
										<span className="font-mono">{token}</span>
									</span>
								))}
							</div>
						</>
					) : (
						<span className="text-muted-foreground text-xs">
							{error ??
								"Paste a Stitch design spec to preview its Material tokens."}
						</span>
					)}
				</div>

				<p className="text-muted-foreground text-sm">
					Colors are saved to the URL; re-import the spec to restore the full
					Material token set, type styles, and brand notes.
				</p>

				<label className="flex flex-col gap-1 text-sm">
					<span className="text-muted-foreground font-medium">
						Stitch spec markdown
					</span>
					<Textarea
						value={value}
						onChange={(event) => setValue(event.target.value)}
						rows={8}
						spellCheck={false}
						placeholder="Paste the Markdown export with YAML frontmatter"
						aria-label="Stitch spec markdown"
						className="resize-none font-mono text-sm"
					/>
				</label>

				<div className="flex justify-end">
					<Button onClick={handleImport} disabled={!spec}>
						{spec ? "Import spec" : "Import"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
