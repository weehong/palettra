"use client";

import type { JSX } from "react";
import { useState } from "react";

import type { FontCategory } from "@/lib/fonts";
import { CURATED_FONTS, fontStack } from "@/lib/fonts";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

type FontPickerProps = {
	value: string;
	label: string;
	onChange: (name: string) => void;
};

const CATEGORY_LABELS: Readonly<Record<FontCategory, string>> = {
	sans: "Sans",
	serif: "Serif",
	mono: "Mono",
};

const CATEGORY_ORDER: ReadonlyArray<FontCategory> = ["sans", "serif", "mono"];

/**
 * Dropdown where each option renders in its own typeface for a live preview.
 * The list is long enough that a search field filters it as you type. Options
 * only mount while the popover is open, so the long list stays lazy.
 */
export function FontPicker({
	value,
	label,
	onChange,
}: FontPickerProps): JSX.Element {
	const [query, setQuery] = useState<string>("");
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const testId = `font-picker-${label.toLowerCase().replace(/\s+/g, "-")}`;

	function close(): void {
		setIsOpen(false);
		setQuery("");
	}

	const needle = query.trim().toLowerCase();
	const visibleFonts = CURATED_FONTS.filter((font) =>
		font.name.toLowerCase().includes(needle),
	);

	return (
		<Popover
			open={isOpen}
			onOpenChange={(next) => {
				setIsOpen(next);
				if (!next) {
					setQuery("");
				}
			}}
		>
			<PopoverTrigger
				data-testid={testId}
				className="flex w-full items-center justify-between rounded-md border border-input bg-card px-2 py-1.5 text-base text-foreground hover:border-muted-foreground"
			>
				<span style={{ fontFamily: fontStack(value) }}>{value}</span>
				<span aria-hidden="true" className="text-xs text-muted-foreground/70">
					▾
				</span>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="max-h-72 w-(--radix-popover-trigger-width) min-w-[12rem] overflow-y-auto p-1"
			>
				<input
					type="search"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search fonts…"
					aria-label={`Search ${label.toLowerCase()} fonts`}
					spellCheck={false}
					className="sticky top-0 mb-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-base text-foreground focus:border-ring focus:outline-none"
				/>
				{visibleFonts.length === 0 ? (
					<p className="px-3 py-2 text-sm text-muted-foreground">
						No fonts match.
					</p>
				) : (
					CATEGORY_ORDER.map((category) => {
						const fonts = visibleFonts.filter(
							(font) => font.category === category,
						);
						if (fonts.length === 0) {
							return null;
						}
						return (
							<div key={category}>
								<p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
									{CATEGORY_LABELS[category]}
								</p>
								{fonts.map((font) => (
									<button
										key={font.name}
										type="button"
										role="option"
										aria-selected={font.name === value}
										onClick={() => {
											onChange(font.name);
											close();
										}}
										style={{ fontFamily: fontStack(font.name) }}
										className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-base hover:bg-muted ${
											font.name === value
												? "text-foreground"
												: "text-muted-foreground"
										}`}
									>
										{font.name}
										{font.name === value ? (
											<span aria-hidden="true">✓</span>
										) : null}
									</button>
								))}
							</div>
						);
					})
				)}
			</PopoverContent>
		</Popover>
	);
}
