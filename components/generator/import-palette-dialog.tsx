"use client";

import type { ChangeEvent, JSX } from "react";
import { useMemo, useState } from "react";

import type { ImportedColor } from "@/lib/import-palette";
import { parsePaletteInput } from "@/lib/import-palette";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ImportPaletteDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onImport: (colors: ReadonlyArray<ImportedColor>) => void;
	requiresConfirmation?: boolean;
};

/**
 * Paste a coolors.co URL, a hex list, or a uicolors.app JSON export (or load
 * the .json file directly) and append the parsed colors as roles. JSON groups
 * keep their palette names. Colors are extracted live for a preview; importing
 * is disabled until at least one valid color is found.
 */
export function ImportPaletteDialog({
	open,
	onOpenChange,
	onImport,
	requiresConfirmation = false,
}: ImportPaletteDialogProps): JSX.Element {
	const [value, setValue] = useState<string>("");
	const [uploadedColors, setUploadedColors] =
		useState<ReadonlyArray<ImportedColor> | null>(null);
	const [isConfirmingImport, setIsConfirmingImport] = useState<boolean>(false);

	const parsedColors = useMemo(() => parsePaletteInput(value), [value]);
	const colors = uploadedColors ?? parsedColors;
	const hasUploadedPalette = uploadedColors !== null;

	function closeDialog(): void {
		setIsConfirmingImport(false);
		onOpenChange(false);
	}

	function handleImport(): void {
		if (colors.length === 0) {
			return;
		}
		if (requiresConfirmation && !isConfirmingImport) {
			setIsConfirmingImport(true);
			return;
		}
		onImport(colors);
		closeDialog();
		setValue("");
		setUploadedColors(null);
	}

	function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}
		void file.text().then((text) => {
			setUploadedColors(parsePaletteInput(text));
			setValue("");
			setIsConfirmingImport(false);
		});
		// Reset so re-selecting the same file fires another change event.
		event.target.value = "";
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					closeDialog();
				}
			}}
		>
			<DialogContent className="sm:max-w-md" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Import palette</DialogTitle>
				</DialogHeader>

				{isConfirmingImport ? (
					<div
						role="alert"
						className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
					>
						<p className="font-medium">
							Save your current palette before importing.
						</p>
						<p className="mt-1">
							Importing will overwrite your existing colors. Export or keep the
							current share URL if you need the existing colors later.
						</p>
					</div>
				) : null}

				{hasUploadedPalette ? null : (
					<label className="flex flex-col gap-1 text-sm">
						<span className="text-muted-foreground font-medium">
							Coolors URL, hex list, or uicolors.app JSON
						</span>
						<Textarea
							value={value}
							onChange={(event) => {
								setValue(event.target.value);
								setUploadedColors(null);
								setIsConfirmingImport(false);
							}}
							rows={3}
							spellCheck={false}
							placeholder="https://coolors.co/264653-2a9d8f-e9c46a or a uicolors.app JSON export"
							aria-label="Coolors URL, hex list, or uicolors.app JSON"
							className="resize-none font-mono text-sm"
						/>
					</label>
				)}

				<label className="flex items-center gap-2 text-sm">
					<span className="border-input text-muted-foreground hover:bg-muted cursor-pointer rounded-md border px-3 py-1.5 font-medium">
						Load JSON file…
					</span>
					<input
						type="file"
						accept=".json,application/json"
						onChange={handleFileChange}
						aria-label="Load JSON file"
						className="sr-only"
					/>
				</label>

				<div
					data-testid={hasUploadedPalette ? "uploaded-color-grid" : undefined}
					className="grid min-h-[2rem] w-full grid-cols-3 gap-3"
				>
					{colors.length > 0 ? (
						colors.map((color) => (
							<span
								key={`${color.name ?? ""}-${color.hex}`}
								data-testid={
									hasUploadedPalette ? "uploaded-color-card" : undefined
								}
								className="border-border flex min-h-24 w-full flex-col items-center justify-center gap-1.5 rounded-md border p-3 text-center text-xs"
							>
								<span
									className="h-5 w-5 rounded"
									style={{ backgroundColor: color.hex }}
									aria-hidden="true"
								/>
								{color.name ? (
									<span className="max-w-full break-words leading-tight">
										{color.name}
									</span>
								) : null}
								<span className="font-mono">{color.hex}</span>
							</span>
						))
					) : (
						<span className="text-muted-foreground col-span-3 text-xs">
							{value.trim().length > 0
								? "No valid colors found."
								: "Paste a palette to preview the colors."}
						</span>
					)}
				</div>

				<div className="flex justify-end gap-2">
					{isConfirmingImport ? (
						<Button
							variant="outline"
							onClick={() => setIsConfirmingImport(false)}
						>
							Review import
						</Button>
					) : null}
					<Button onClick={handleImport} disabled={colors.length === 0}>
						{isConfirmingImport
							? "Import colors"
							: colors.length > 0
								? `Import ${colors.length} color${colors.length === 1 ? "" : "s"}`
								: "Import"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
