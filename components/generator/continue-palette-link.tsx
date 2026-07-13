"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { useSyncExternalStore } from "react";

import {
	readRestorablePaletteHref,
	subscribeToRecentPalette,
} from "@/lib/recent-palette";

export function ContinuePaletteLink(): JSX.Element | null {
	usePathname();
	useSearchParams();
	const href = useSyncExternalStore(
		subscribeToRecentPalette,
		readRestorablePaletteHref,
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
