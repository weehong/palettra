"use client";

import type { JSX } from "react";
import { useState } from "react";
import type { User } from "firebase/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Theme } from "@/lib/theme";
import type { Typography } from "@/lib/typography";
import type { OpenedSavedPalette } from "@/lib/open-palette";
import { useAuth } from "@/components/auth/auth-context";
import { getFirebaseDb } from "@/lib/firebase";
import {
	paletteDocFromState,
	savePalette,
	updatePalette,
} from "@/lib/palette-collection";
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
import { Spinner } from "@/components/ui/spinner";
import { trackEvent } from "@/lib/analytics";

type SavePaletteButtonProps = {
	theme: Theme;
	typography: Typography;
	existingPalette?: OpenedSavedPalette | null;
	onSaved?: (palette: OpenedSavedPalette) => void;
};

type SaveAction =
	| { type: "create"; name: string }
	| { type: "overwrite"; palette: OpenedSavedPalette };

// Gate before SignedInSaveButton so its react-query hooks never run (and need
// no QueryClientProvider) unless a user is signed in.
export function SavePaletteButton({
	theme,
	typography,
	existingPalette,
	onSaved,
}: SavePaletteButtonProps): JSX.Element | null {
	const { status, user } = useAuth();

	if (status !== "signed-in" || !user) {
		return null;
	}

	return (
		<SignedInSaveButton
			theme={theme}
			typography={typography}
			existingPalette={existingPalette}
			onSaved={onSaved}
			user={user}
		/>
	);
}

function SignedInSaveButton({
	theme,
	typography,
	existingPalette,
	onSaved,
	user,
}: SavePaletteButtonProps & { user: User }): JSX.Element {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [showNameForm, setShowNameForm] = useState(false);

	const mutation = useMutation({
		mutationFn: async (action: SaveAction) => {
			const db = getFirebaseDb();
			if (!db) {
				throw new Error("Firestore is not configured");
			}
			const input = {
				...paletteDocFromState(theme, typography),
				name: action.type === "create" ? action.name : action.palette.name,
			};
			if (action.type === "overwrite") {
				await updatePalette(db, user.uid, action.palette.id, input);
				return action.palette;
			}
			const id = await savePalette(db, user.uid, input);
			return { id, name: action.name };
		},
		onSuccess: (savedPalette) => {
			void queryClient.invalidateQueries({ queryKey: ["palettes", user.uid] });
			setOpen(false);
			onSaved?.(savedPalette);
			toast.success("Palette saved");
			trackEvent("palette_saved", {
				role_count: theme.roles.length,
				primary_hex: theme.roles[0]?.hex ?? null,
			});
		},
		onError: () => {
			toast.error("Couldn't save palette — try again");
			trackEvent("palette_save_failed");
		},
	});

	function openDialog(): void {
		setName(
			existingPalette?.name
				? `${existingPalette.name} copy`
				: paletteDocFromState(theme, typography).name,
		);
		setShowNameForm(!existingPalette);
		setOpen(true);
	}

	return (
		<>
			<Button
				variant="outline"
				size="toolbar"
				onClick={openDialog}
				className="rounded-full font-semibold"
			>
				Save
			</Button>

			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (!mutation.isPending) {
						setOpen(next);
					}
				}}
			>
				<DialogContent className="sm:max-w-sm">
					{existingPalette && !showNameForm ? (
						<>
							<DialogHeader>
								<DialogTitle>Save existing palette?</DialogTitle>
								<DialogDescription>
									Overwrite {existingPalette.name} or create a new palette from
									your changes.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setOpen(false)}
									disabled={mutation.isPending}
								>
									Cancel
								</Button>
								<Button
									variant="outline"
									onClick={() => setShowNameForm(true)}
									disabled={mutation.isPending}
								>
									Create new
								</Button>
								<Button
									onClick={() =>
										mutation.mutate({
											type: "overwrite",
											palette: existingPalette,
										})
									}
									disabled={mutation.isPending}
									aria-busy={mutation.isPending}
									className="min-w-24 font-semibold disabled:cursor-wait"
								>
									{mutation.isPending ? (
										<Spinner label="Overwriting palette" />
									) : (
										"Overwrite"
									)}
								</Button>
							</DialogFooter>
						</>
					) : (
						<form
							className="flex flex-col gap-4"
							onSubmit={(event) => {
								event.preventDefault();
								const trimmed = name.trim();
								if (trimmed) {
									mutation.mutate({ type: "create", name: trimmed });
								}
							}}
						>
							<DialogHeader>
								<DialogTitle>Save palette</DialogTitle>
								<DialogDescription>
									Choose a name for the new palette.
								</DialogDescription>
							</DialogHeader>
							<label className="flex flex-col gap-2 text-sm font-medium">
								Palette name
								<Input
									value={name}
									onChange={(event) => setName(event.target.value)}
									disabled={mutation.isPending}
									autoFocus
									className="font-normal"
								/>
							</label>
							<div className="flex justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => setOpen(false)}
									disabled={mutation.isPending}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={mutation.isPending || name.trim().length === 0}
									aria-busy={mutation.isPending}
									className="min-w-28 font-semibold disabled:cursor-wait"
								>
									{mutation.isPending ? (
										<Spinner label="Saving palette" />
									) : (
										"Save palette"
									)}
								</Button>
							</div>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
