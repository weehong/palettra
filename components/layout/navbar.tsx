"use client";

import type { JSX } from "react";
import { Suspense, useState } from "react";
import Link from "next/link";

import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { CollectionDialog } from "@/components/collection/collection-dialog";
import { ContinuePaletteLink } from "@/components/generator/continue-palette-link";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/lib/site-config";

export function Navbar(): JSX.Element {
	const [signInOpen, setSignInOpen] = useState(false);
	const [collectionOpen, setCollectionOpen] = useState(false);

	function openCollection(): void {
		setCollectionOpen(true);
		trackEvent("collection_opened");
	}

	return (
		<header className="border-border bg-card flex h-20 shrink-0 items-center justify-between border-b px-5">
			<Link href="/" className="text-foreground flex items-baseline gap-3">
				<span className="text-foreground text-4xl font-normal tracking-normal">
					{siteConfig.headline}
				</span>
				<span
					aria-hidden="true"
					className="text-muted-foreground hidden text-sm lg:inline"
				>
					Tailwind v4 OKLCH color systems from one color
				</span>
			</Link>
			<nav aria-label="Account" className="flex items-center gap-2">
				<Suspense fallback={null}>
					<ContinuePaletteLink />
				</Suspense>
				<UserMenu
					onSignInClick={() => setSignInOpen(true)}
					onOpenCollection={openCollection}
				/>
			</nav>
			<SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
			<CollectionDialog
				open={collectionOpen}
				onOpenChange={setCollectionOpen}
			/>
		</header>
	);
}
