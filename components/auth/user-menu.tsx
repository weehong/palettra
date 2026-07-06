"use client";

import type { JSX } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";

type UserMenuProps = {
	onSignInClick: () => void;
	onOpenCollection: () => void;
};

function initials(
	name: string | null | undefined,
	email: string | null,
): string {
	const source = name ?? email ?? "?";
	return source
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}

const menuItemClass = "w-full px-3 py-2 text-base text-foreground";

export function UserMenu({
	onSignInClick,
	onOpenCollection,
}: UserMenuProps): JSX.Element | null {
	const { user, status, signOut } = useAuth();
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);

	if (status === "disabled") {
		return null;
	}

	if (status !== "signed-in" || !user) {
		return (
			<Button variant="outline" onClick={onSignInClick} className="font-semibold">
				Sign in
			</Button>
		);
	}

	async function handleSignOut(): Promise<void> {
		setIsSigningOut(true);
		try {
			await signOut();
		} finally {
			setIsSigningOut(false);
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label="Account"
				className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-shadow hover:ring-2 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				{user.photoURL ? (
					// eslint-disable-next-line @next/next/no-img-element -- Firebase avatars are remote user URLs; the plan explicitly avoids next/image config for them.
					<img
						src={user.photoURL}
						alt=""
						referrerPolicy="no-referrer"
						className="h-9 w-9 rounded-full object-cover"
					/>
				) : (
					<span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
						{initials(user.displayName, user.email)}
					</span>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56 p-1.5">
				<DropdownMenuItem onSelect={onOpenCollection} className={menuItemClass}>
					My palettes
				</DropdownMenuItem>
				<DropdownMenuItem
					onSelect={() => router.push("/settings")}
					className={menuItemClass}
				>
					Settings
				</DropdownMenuItem>
				<DropdownMenuItem
					onSelect={(event) => {
						// Keep the menu open so the pending spinner stays visible.
						event.preventDefault();
						void handleSignOut();
					}}
					disabled={isSigningOut}
					aria-busy={isSigningOut}
					className={`${menuItemClass} data-[disabled]:cursor-wait data-[disabled]:opacity-60`}
				>
					{isSigningOut ? (
						<span className="inline-flex items-center gap-2">
							<Spinner label="Signing out" />
						</span>
					) : (
						"Sign out"
					)}
				</DropdownMenuItem>
				{user.email ? (
					<div className="mt-1.5 border-t border-border px-3 pt-2 pb-1">
						<p
							className="truncate text-sm text-muted-foreground"
							title={user.email}
						>
							{user.email}
						</p>
					</div>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
