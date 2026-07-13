"use client";

import Link from "next/link";
import type { JSX } from "react";
import { useSyncExternalStore } from "react";

import { readRecentPaletteHref } from "@/lib/recent-palette";

export function ContinuePaletteLink(): JSX.Element | null {
	const href = useSyncExternalStore(
		() => () => {},
		readRecentPaletteHref,
		() => null,
	);

	if (!href) return null;

	return (
		<Link
			href={href}
			className="text-primary hover:text-primary-hover text-sm font-semibold underline underline-offset-4"
		>
			Continue your last palette
		</Link>
	);
}
