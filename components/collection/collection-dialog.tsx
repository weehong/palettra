"use client";

import type { JSX } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/auth-context";
import { getFirebaseDb } from "@/lib/firebase";
import {
	deletePalette,
	listPalettes,
	renamePalette,
	type SavedPalette,
} from "@/lib/palette-collection";
import { buildThemeHref } from "@/lib/theme";
import {
	openPaletteOnCurrentPage,
	rememberPendingSavedPalette,
} from "@/lib/open-palette";
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

type CollectionDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function relativeDate(value: string | null): string {
	if (!value) {
		return "Unknown";
	}
	const diff = Date.now() - new Date(value).getTime();
	const minutes = Math.max(1, Math.round(diff / 60000));
	if (minutes < 60) {
		return `${minutes}m ago`;
	}
	const hours = Math.round(minutes / 60);
	if (hours < 24) {
		return `${hours}h ago`;
	}
	return `${Math.round(hours / 24)}d ago`;
}

export function CollectionDialog({
	open,
	onOpenChange,
}: CollectionDialogProps): JSX.Element {
	const { user } = useAuth();
	const uid = user?.uid;
	const router = useRouter();
	const queryClient = useQueryClient();
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState("");

	const palettesQuery = useQuery({
		queryKey: ["palettes", uid],
		enabled: open && Boolean(uid),
		queryFn: async () => {
			if (!uid) {
				return [];
			}
			const db = getFirebaseDb();
			if (!db) {
				return [];
			}
			return listPalettes(db, uid);
		},
	});

	const invalidate = () => {
		if (uid) {
			void queryClient.invalidateQueries({ queryKey: ["palettes", uid] });
		}
	};

	const deleteMutation = useMutation({
		mutationFn: async (paletteId: string) => {
			if (!uid) {
				return;
			}
			const db = getFirebaseDb();
			if (db) {
				await deletePalette(db, uid, paletteId);
			}
		},
		onSuccess: () => {
			invalidate();
			trackEvent("palette_deleted");
		},
		onError: () => {
			trackEvent("palette_mutation_failed", { action: "delete" });
		},
	});

	const renameMutation = useMutation({
		mutationFn: async ({ id, name }: { id: string; name: string }) => {
			if (!uid) {
				return;
			}
			const db = getFirebaseDb();
			if (db) {
				await renamePalette(db, uid, id, name);
			}
		},
		onSuccess: () => {
			setRenamingId(null);
			invalidate();
			trackEvent("palette_renamed");
		},
		onError: () => {
			trackEvent("palette_mutation_failed", { action: "rename" });
		},
	});

	function handleOpen(palette: SavedPalette): void {
		const theme = { roles: palette.roles };
		const typography = palette.typography ?? undefined;
		const savedPalette = { id: palette.id, name: palette.name };
		if (!openPaletteOnCurrentPage({ theme, typography, savedPalette })) {
			rememberPendingSavedPalette(savedPalette);
			router.push(buildThemeHref(theme, typography));
		}
		trackEvent("palette_opened", { role_count: palette.roles.length });
		onOpenChange(false);
	}

	function startRename(palette: SavedPalette): void {
		setRenamingId(palette.id);
		setRenameValue(palette.name);
	}

	const palettes = palettesQuery.data ?? [];
	const deletingId = deleteMutation.isPending ? deleteMutation.variables : null;
	const renamingMutationId = renameMutation.isPending
		? renameMutation.variables?.id
		: null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="flex max-h-[80dvh] flex-col sm:max-w-3xl"
				aria-describedby={undefined}
			>
				<DialogHeader>
					<DialogTitle>My palettes</DialogTitle>
				</DialogHeader>

				{deleteMutation.isError ? (
					<p role="alert" className="text-destructive text-sm">
						Could not delete the palette. Please try again.
					</p>
				) : null}
				{renameMutation.isError ? (
					<p role="alert" className="text-destructive text-sm">
						Could not rename the palette. Please try again.
					</p>
				) : null}

				<div className="min-h-40 overflow-y-auto">
					{!uid ? (
						<p className="text-muted-foreground text-sm">
							Sign in to see saved palettes.
						</p>
					) : palettesQuery.isLoading ? (
						<div className="text-muted-foreground flex min-h-40 items-center justify-center">
							<Spinner label="Loading palettes" />
						</div>
					) : palettesQuery.isError ? (
						<p className="text-destructive text-sm">Could not load palettes.</p>
					) : palettes.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No saved palettes yet.
						</p>
					) : (
						<ul className="flex flex-col gap-2">
							{palettes.map((palette) => (
								<li
									key={palette.id}
									className="border-border flex flex-col gap-3 rounded-lg border p-3"
								>
									<div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
										<div className="min-w-0 flex-1">
											{renamingId === palette.id ? (
												<form
													className="flex gap-2"
													onSubmit={(event) => {
														event.preventDefault();
														renameMutation.mutate({
															id: palette.id,
															name: renameValue,
														});
													}}
												>
													<Input
														value={renameValue}
														onChange={(event) =>
															setRenameValue(event.target.value)
														}
														disabled={renamingMutationId === palette.id}
														className="flex-1"
													/>
													<Button
														type="submit"
														disabled={renamingMutationId === palette.id}
														aria-busy={renamingMutationId === palette.id}
														className="min-w-16 font-semibold disabled:cursor-wait"
													>
														{renamingMutationId === palette.id ? (
															<Spinner label="Renaming palette" />
														) : (
															"Save"
														)}
													</Button>
												</form>
											) : (
												<>
													<h3 className="truncate text-base font-semibold">
														{palette.name}
													</h3>
													<p className="text-muted-foreground text-sm">
														Updated {relativeDate(palette.updatedAt)}
													</p>
												</>
											)}
											<div className="mt-2 grid w-full grid-cols-8 overflow-hidden rounded-md sm:grid-cols-10">
												{palette.roles.map((role) => (
													<span
														key={role.id}
														className="aspect-square w-full cursor-help transition-[filter] hover:brightness-110"
														style={{ backgroundColor: role.hex }}
														title={role.hex.toUpperCase()}
														aria-label={`${role.name}: ${role.hex.toUpperCase()}`}
													/>
												))}
											</div>
										</div>

										<div className="flex w-full flex-row justify-between gap-2 sm:w-auto sm:min-w-24 sm:flex-col">
											<Button
												aria-label={`Open ${palette.name}`}
												size="toolbar"
												onClick={() => handleOpen(palette)}
												disabled={deletingId === palette.id}
												className="rounded-full font-semibold"
											>
												Open
											</Button>
											<Button
												variant="outline"
												size="toolbar"
												onClick={() => startRename(palette)}
												disabled={deletingId === palette.id}
												className="rounded-full font-semibold disabled:cursor-wait"
											>
												Rename
											</Button>
											<Button
												variant="outline"
												size="toolbar"
												onClick={() => {
													if (window.confirm("Delete this palette?")) {
														deleteMutation.mutate(palette.id);
													}
												}}
												disabled={deletingId === palette.id}
												aria-busy={deletingId === palette.id}
												className="text-destructive hover:text-destructive min-w-20 rounded-full font-semibold disabled:cursor-wait"
											>
												{deletingId === palette.id ? (
													<Spinner label="Deleting palette" />
												) : (
													"Delete"
												)}
											</Button>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
