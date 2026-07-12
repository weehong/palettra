"use client";

import type { ChangeEvent, JSX } from "react";
import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";

import type { Palette, Shade } from "@/lib/color";
import { isValidHex, normalizeHex } from "@/lib/color";
import type { ColorRole } from "@/lib/theme";
import { HslSliders } from "@/components/generator/hsl-sliders";
import { SwatchRow } from "@/components/generator/swatch-row";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type ColorRolePanelProps = {
	role: ColorRole;
	palette: Palette;
	isPrimary: boolean;
	roleLabel?: string;
	canRemove: boolean;
	copiedKey: string | null;
	onCopy: (hex: string) => void;
	onNameChange: (id: string, name: string) => void;
	onHexChange: (id: string, hex: string) => void;
	onToggleAuto: (id: string) => void;
	onToggleLocked: (id: string) => void;
	onRemove: (id: string) => void;
	onSemanticNameChange: (id: string, shade: Shade, name: string) => void;
	onBulkSemanticNameChange: (
		id: string,
		name: string,
		applyShadeNumbers?: boolean,
	) => void;
};

/** One color role: name, hex entry, auto toggle, sliders, and its 50–950 scale. */
export function ColorRolePanel({
	role,
	palette,
	isPrimary,
	roleLabel,
	canRemove,
	copiedKey,
	onCopy,
	onNameChange,
	onHexChange,
	onToggleAuto,
	onToggleLocked,
	onRemove,
	onSemanticNameChange,
	onBulkSemanticNameChange,
}: ColorRolePanelProps): JSX.Element {
	const effectiveHex = palette.baseHex;
	const [draft, setDraft] = useState<string>(effectiveHex);
	const [syncedHex, setSyncedHex] = useState<string>(effectiveHex);
	const [bulkSemanticName, setBulkSemanticName] = useState("");
	const [applySemanticShadeNumbers, setApplySemanticShadeNumbers] =
		useState(false);

	// Adopt externally-driven hex changes (sliders, auto-derivation, primary edits)
	// during render instead of via a state-setting effect.
	if (effectiveHex !== syncedHex) {
		setSyncedHex(effectiveHex);
		setDraft(effectiveHex);
	}

	const isInvalid = !isValidHex(draft);
	// Tint the whole card with the lightest stop of its own scale so the panel
	// previews the selected color even before looking at the swatches.
	const shade50 = palette.shades.find((entry) => entry.shade === 50)?.hex;

	function handleHexInput(event: ChangeEvent<HTMLInputElement>): void {
		const value = event.target.value;
		setDraft(value);
		const normalized = normalizeHex(value);
		if (normalized) {
			onHexChange(role.id, normalized);
		}
	}

	return (
		<section
			aria-label={`${role.name} color`}
			className="border-border flex flex-col gap-4 rounded-xl border p-5"
			style={{ backgroundColor: shade50 }}
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-start gap-2">
					<span
						className="h-8 w-8 shrink-0 rounded-md border border-black/10 dark:border-white/10"
						style={{ backgroundColor: effectiveHex }}
						aria-hidden="true"
					/>
					<div className="flex min-w-0 flex-col items-start gap-1">
						<input
							type="text"
							value={role.name}
							onChange={(event) => onNameChange(role.id, event.target.value)}
							aria-label={`${role.name} name`}
							className="text-foreground hover:border-input focus:border-ring w-36 rounded-md border border-transparent bg-transparent px-2 py-1 text-base font-semibold focus:outline-none"
						/>
						{roleLabel ? (
							<span
								data-testid="color-card-role-pill"
								className="border-input text-muted-foreground ml-2 shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold"
							>
								{roleLabel}
							</span>
						) : null}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Input
						type="text"
						value={draft}
						onChange={handleHexInput}
						spellCheck={false}
						aria-label={`${role.name} hex`}
						aria-invalid={isInvalid}
						className="w-28 px-2 font-mono"
					/>
					<button
						type="button"
						onClick={() => onToggleLocked(role.id)}
						aria-label={`${role.locked ? "Unlock" : "Lock"} ${role.name} color`}
						aria-pressed={role.locked ?? false}
						title={role.locked ? "Unlock color" : "Lock color"}
						className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-2"
					>
						{role.locked ? (
							<Lock className="h-4 w-4" aria-hidden="true" />
						) : (
							<LockOpen className="h-4 w-4" aria-hidden="true" />
						)}
					</button>

					{!isPrimary ? (
						<label className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
							<Checkbox
								checked={role.auto}
								disabled={!role.preset}
								onCheckedChange={() => onToggleAuto(role.id)}
								aria-label={`Auto-derive ${role.name} from primary`}
							/>
							Auto
						</label>
					) : null}
					{canRemove ? (
						<button
							type="button"
							onClick={() => onRemove(role.id)}
							aria-label={`Remove ${role.name}`}
							className="text-muted-foreground hover:bg-muted hover:text-destructive rounded-md px-2 py-1 text-base"
						>
							✕
						</button>
					) : null}
				</div>
			</div>

			<section
				aria-label={`${role.name} row semantic names`}
				className="border-input bg-background flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-end"
			>
				<label className="min-w-0 flex-1 space-y-1 text-sm font-medium">
					<span>Row semantic name</span>
					<Input
						value={bulkSemanticName}
						onChange={(event) => {
							const name = event.target.value;
							setBulkSemanticName(name);
							onBulkSemanticNameChange(
								role.id,
								name,
								applySemanticShadeNumbers,
							);
						}}
						placeholder="Enter a semantic name"
						aria-label={`${role.name} row semantic name`}
					/>
				</label>
				<label className="text-foreground flex items-center gap-2 text-sm font-medium sm:pb-2">
					<Checkbox
						checked={applySemanticShadeNumbers}
						aria-label={`${role.name} apply shade numbers`}
						onCheckedChange={(checked) => {
							const enabled = Boolean(checked);
							setApplySemanticShadeNumbers(enabled);
						onBulkSemanticNameChange(
							role.id,
							bulkSemanticName,
							enabled,
							);
						}}
					/>
					Apply shade numbers
				</label>
			</section>

			<SwatchRow
				shades={palette.shades}
				copiedKey={copiedKey}
				onCopy={onCopy}
				semanticNames={role.semanticNames}
				onSemanticNameChange={(shade, name) =>
					onSemanticNameChange(role.id, shade, name)
				}
			/>

			<HslSliders
				baseHex={effectiveHex}
				onHexChange={(hex) => onHexChange(role.id, hex)}
			/>
		</section>
	);
}
