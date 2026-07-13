"use client";

import type { JSX } from "react";
import { Upload } from "lucide-react";

import { PALETTE_JSON_TEMPLATE } from "@/lib/import-palette";
import { buttonVariants } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ImportMenuProps = {
	onImportColor: () => void;
	onImportStitch: () => void;
};

function downloadJsonTemplate(): void {
	const blob = new Blob([PALETTE_JSON_TEMPLATE], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = "color-palette-template.json";
	anchor.click();
	URL.revokeObjectURL(url);
}

const itemClass = "flex w-full flex-col items-start gap-1 px-4 py-3";

/** Toolbar dropdown for the palette import flows and the JSON template. */
export function ImportMenu({
	onImportColor,
	onImportStitch,
}: ImportMenuProps): JSX.Element {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				data-testid="import-menu"
				className={cn(
					buttonVariants({ variant: "outline", size: "toolbar" }),
					"rounded-full font-semibold shadow-xs",
				)}
			>
				<Upload aria-hidden="true" />
				Import
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-80 p-1.5">
				<DropdownMenuItem
					data-testid="import-palette"
					onSelect={onImportColor}
					className={itemClass}
				>
					<span className="text-foreground text-base font-medium">
						Import Color
					</span>
					<span className="text-muted-foreground text-sm">
						Paste a Coolors URL, hex list, or UIColors JSON.
					</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					data-testid="import-stitch"
					onSelect={onImportStitch}
					className={itemClass}
				>
					<span className="text-foreground text-base font-medium">
						Import from Google Stitch
					</span>
					<span className="text-muted-foreground text-sm">
						Paste a Stitch design spec.
					</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					data-testid="download-template"
					onSelect={downloadJsonTemplate}
					className={itemClass}
				>
					<span className="text-foreground text-base font-medium">
						Download Color JSON template
					</span>
					<span className="text-muted-foreground text-sm">
						A sample file you can fill in and import.
					</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
