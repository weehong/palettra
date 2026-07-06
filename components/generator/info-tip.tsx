"use client";

import type { JSX } from "react";

type InfoTipProps = {
	text: string;
};

/**
 * Hover tooltip on a small "i" badge. Marked aria-hidden so it never leaks
 * into the accessible name of the tab or button it sits beside.
 */
export function InfoTip({ text }: InfoTipProps): JSX.Element {
	return (
		<span aria-hidden="true" className="group relative inline-flex">
			<span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-current text-xs leading-none opacity-60">
				i
			</span>
			<span
				data-slot="info-tip-content"
				className="pointer-events-none absolute top-full right-0 z-20 mt-2 hidden w-64 rounded-md bg-foreground px-3 py-2 text-left text-sm font-normal normal-case whitespace-normal text-background shadow-lg group-hover:block"
			>
				{text}
			</span>
		</span>
	);
}
