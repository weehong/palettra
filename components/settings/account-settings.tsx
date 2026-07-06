"use client";

import type { JSX } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
	AccountDeletionError,
	deleteAccount,
} from "@/lib/account";
import { useAuth } from "@/components/auth/auth-context";
import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const cardClass = "rounded-md border border-border bg-card p-5";
const cancelCodes = new Set([
	"auth/popup-closed-by-user",
	"auth/cancelled-popup-request",
	"auth/user-cancelled",
]);

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

function deletionMessage(error: unknown): string | null {
	if (!(error instanceof AccountDeletionError)) {
		return "Could not delete your account. Nothing was removed. Try again.";
	}

	if (error.stage === "reauth" && error.code && cancelCodes.has(error.code)) {
		return null;
	}

	if (error.stage === "data" || error.stage === "auth-delete") {
		return "Some or all of your saved palettes were deleted, but the account could not be fully removed. Try again to finish.";
	}

	return "Could not delete your account. Nothing was removed. Try again.";
}

export function AccountSettings(): JSX.Element {
	const { user, status } = useAuth();
	const router = useRouter();
	const [signInOpen, setSignInOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [confirmation, setConfirmation] = useState("");
	const [pending, setPending] = useState(false);
	const [alert, setAlert] = useState<string | null>(null);

	function resetDeleteDialog(): void {
		setConfirmation("");
		setPending(false);
		setAlert(null);
	}

	function handleDeleteOpenChange(open: boolean): void {
		if (pending) {
			return;
		}
		setDeleteOpen(open);
		if (!open) {
			resetDeleteDialog();
		}
	}

	async function handleDeleteAccount(): Promise<void> {
		if (confirmation !== "DELETE" || pending) {
			return;
		}

		setPending(true);
		setAlert(null);
		try {
			await deleteAccount();
			setDeleteOpen(false);
			resetDeleteDialog();
			router.push("/");
		} catch (error) {
			const message = deletionMessage(error);
			if (message) {
				setAlert(message);
			}
		} finally {
			setPending(false);
		}
	}

	if (status === "disabled") {
		return (
			<section className={cardClass}>
				<p className="text-base text-muted-foreground">
					Accounts are not enabled on this deployment.
				</p>
			</section>
		);
	}

	if (status === "loading") {
		return (
			<section
				aria-label="Loading account settings"
				className={`${cardClass} flex items-center justify-center py-10`}
			>
				<Spinner label="Loading account settings" />
			</section>
		);
	}

	if (status === "signed-out" || !user) {
		return (
			<>
				<section className={`${cardClass} flex flex-col items-start gap-4`}>
					<p className="text-base text-muted-foreground">
						Sign in to manage your account.
					</p>
					<Button onClick={() => setSignInOpen(true)}>Sign in</Button>
				</section>
				<SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
			</>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<section className={`${cardClass} flex items-center gap-4`}>
				{user.photoURL ? (
					// eslint-disable-next-line @next/next/no-img-element -- Firebase avatars are remote user URLs; avoid next/image config for account provider images.
					<img
						src={user.photoURL}
						alt=""
						referrerPolicy="no-referrer"
						className="h-12 w-12 rounded-full object-cover"
					/>
				) : (
					<span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
						{initials(user.displayName, user.email)}
					</span>
				)}
				<div className="min-w-0">
					<h2 className="text-lg font-semibold">Account</h2>
					<p className="truncate text-base text-foreground">
						{user.displayName ?? "Signed-in account"}
					</p>
					{user.email ? (
						<p
							className="truncate text-sm text-muted-foreground"
							title={user.email}
						>
							{user.email}
						</p>
					) : null}
				</div>
			</section>

			<section className={`${cardClass} border-destructive/30`}>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="max-w-md">
						<h2 className="text-lg font-semibold text-destructive">
							Danger zone
						</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							Delete account permanently. This deletes your account and all
							saved palettes; this cannot be undone.
						</p>
					</div>
					<Button
						variant="destructive"
						onClick={() => setDeleteOpen(true)}
						className="sm:shrink-0"
					>
						Delete account
					</Button>
				</div>
			</section>

			<Dialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
				<DialogContent
					showCloseButton={!pending}
					className="sm:max-w-md"
					aria-describedby="delete-account-description"
				>
					<DialogHeader>
						<DialogTitle>Delete account</DialogTitle>
						<DialogDescription id="delete-account-description">
							This permanently deletes your account and all saved palettes. This
							cannot be undone.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-2">
						<Label htmlFor="delete-confirmation">Confirmation</Label>
						<Input
							id="delete-confirmation"
							value={confirmation}
							onChange={(event) => setConfirmation(event.target.value)}
							disabled={pending}
							autoComplete="off"
						/>
						<p className="text-sm text-muted-foreground">
							Type DELETE to continue.
						</p>
					</div>

					{alert ? (
						<p
							role="alert"
							className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{alert}
						</p>
					) : null}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => handleDeleteOpenChange(false)}
							disabled={pending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => void handleDeleteAccount()}
							disabled={pending || confirmation !== "DELETE"}
							aria-busy={pending}
							className="disabled:cursor-wait"
						>
							{pending ? (
								<>
									<Spinner label="Deleting account" />
									<span aria-hidden="true">Deleting account</span>
								</>
							) : (
								"Permanently delete account"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
