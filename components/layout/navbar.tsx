"use client";

import type { JSX } from "react";
import { useState } from "react";
import Link from "next/link";

import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { CollectionDialog } from "@/components/collection/collection-dialog";
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
		<header className="flex h-20 shrink-0 items-center justify-between border-b border-border bg-card px-5">
			<Link href="/" className="text-foreground">
				<h1 className="text-foreground text-4xl font-normal tracking-normal">
					{siteConfig.headline}
				</h1>
			</Link>
			<nav aria-label="Account" className="flex items-center gap-2">
				<UserMenu
					onSignInClick={() => setSignInOpen(true)}
					onOpenCollection={openCollection}
				/>
			</nav>
			<SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
			<CollectionDialog open={collectionOpen} onOpenChange={setCollectionOpen} />
		</header>
	);
}
