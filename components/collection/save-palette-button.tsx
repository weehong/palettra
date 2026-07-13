"use client";

import type { JSX } from "react";
import { useState } from "react";
import type { User } from "firebase/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Theme } from "@/lib/theme";
import type { Typography } from "@/lib/typography";
import { useAuth } from "@/components/auth/auth-context";
import { getFirebaseDb } from "@/lib/firebase";
import { paletteDocFromState, savePalette } from "@/lib/palette-collection";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { trackEvent } from "@/lib/analytics";

type SavePaletteButtonProps = {
	theme: Theme;
	typography: Typography;
};

// Gate before SignedInSaveButton so its react-query hooks never run (and need
// no QueryClientProvider) unless a user is signed in.
export function SavePaletteButton({
	theme,
	typography,
}: SavePaletteButtonProps): JSX.Element | null {
	const { status, user } = useAuth();

	if (status !== "signed-in" || !user) {
		return null;
	}

	return (
		<SignedInSaveButton theme={theme} typography={typography} user={user} />
	);
}

function SignedInSaveButton({
	theme,
	typography,
	user,
}: SavePaletteButtonProps & { user: User }): JSX.Element {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");

	const mutation = useMutation({
		mutationFn: async (paletteName: string) => {
			const db = getFirebaseDb();
			if (!db) {
				throw new Error("Firestore is not configured");
			}
			return savePalette(db, user.uid, {
				...paletteDocFromState(theme, typography),
				name: paletteName,
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["palettes", user.uid] });
			setOpen(false);
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
		setName(paletteDocFromState(theme, typography).name);
		setOpen(true);
	}

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				onClick={openDialog}
				className="h-9 rounded-full px-3.5 font-semibold"
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
				<DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
					<form
						className="flex flex-col gap-4"
						onSubmit={(event) => {
							event.preventDefault();
							const trimmed = name.trim();
							if (trimmed) {
								mutation.mutate(trimmed);
							}
						}}
					>
						<DialogHeader>
							<DialogTitle>Save palette</DialogTitle>
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
				</DialogContent>
			</Dialog>
		</>
	);
}
