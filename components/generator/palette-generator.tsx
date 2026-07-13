"use client";

import type { CSSProperties, JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Circle, CircleDot } from "lucide-react";

import type { Palette, Shade } from "@/lib/color";
import { generatePalette, themeToCssVars, withUniqueSlugs } from "@/lib/color";
import { enforceThemeContrast, type AiSiteTheme } from "@/lib/ai-site-theme";
import { siteConfig } from "@/lib/site-config";
import { siteThemeVars } from "@/lib/site-theme";
import type { ColorRole, PresetKey, Theme } from "@/lib/theme";
import {
	buildThemeHref,
	createCustomRole,
	createPrimaryRole,
	createPresetRole,
	defaultTheme,
	effectiveHex,
	STATUS_PRESETS,
} from "@/lib/theme";
import type { Typography } from "@/lib/typography";
import { defaultTypography, isDefaultTypography } from "@/lib/typography";
import type { ImportedColor } from "@/lib/import-palette";
import type { StitchSpec } from "@/lib/stitch";
import { stitchToCssVars, stitchToTheme } from "@/lib/stitch";
import { SavePaletteButton } from "@/components/collection/save-palette-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ColorRolePanel } from "@/components/generator/color-role-panel";
import { ExportDialog } from "@/components/generator/export-dialog";
import { FontPreviewLoader } from "@/components/generator/font-preview-loader";
import { InfoTip } from "@/components/generator/info-tip";
import { ImportMenu } from "@/components/generator/import-menu";
import { ImportPaletteDialog } from "@/components/generator/import-palette-dialog";
import { ImportStitchDialog } from "@/components/generator/import-stitch-dialog";
import { PreviewOverlay } from "@/components/generator/preview-overlay";
import { StitchTokensPanel } from "@/components/generator/stitch-tokens-panel";
import { TypographyPanel } from "@/components/generator/typography-panel";
import { useCopyToClipboard } from "@/components/generator/use-copy-to-clipboard";
import { useSiteTheme } from "@/components/generator/use-site-theme";
import { Spinner } from "@/components/ui/spinner";
import { trackEvent } from "@/lib/analytics";

type PaletteGeneratorProps = {
	initialTheme: Theme;
	initialTypography?: Typography;
	aiEnabled?: boolean;
	aiDefaultModel?: string;
	// Site theming is temporarily withdrawn from the app (2026-07-05); pages
	// pass neither this nor aiEnabled. Re-enable by threading both again.
	applyToSiteEnabled?: boolean;
};

function randomHex(): string {
	const value = Math.floor(Math.random() * 0xffffff);
	return `#${value.toString(16).padStart(6, "0")}`;
}

// Tab order: Colors | Neutral | Status ¦ Fonts (fonts last — it edits type,
// not color scales).
const TAB_COLORS = 0;
const TAB_NEUTRAL = 1;
const TAB_STATUS = 2;
const TAB_FONTS = 3;

/** Radix Tabs are string-valued; index-aligned with the TAB_* constants. */
const TAB_VALUES = ["color", "neutral", "status", "font"] as const;

const addButtonClass = cn(buttonVariants({ variant: "outline" }), "px-3");

const stickyFooterClass =
	"sticky bottom-0 z-10 mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card py-3 p-5 md:p-6";

const toolbarButtonClass = {
	outline: cn(buttonVariants({ variant: "outline" }), "font-semibold"),
	primaryWide: cn(buttonVariants({ variant: "default" }), "px-6 font-semibold"),
};

/** Default name for the color at a pill position: Primary, Secondary, …. */
function positionalName(position: number): string {
	const names = ["Primary", "Secondary", "Tertiary"];
	return names[position] ?? `Color ${position + 1}`;
}

/** True when a name still matches a positional default (never user-typed). */
function isDefaultName(name: string): boolean {
	return /^(Primary|Secondary|Tertiary|Color \d+)$/.test(name);
}

function isStatusRole(role: ColorRole): boolean {
	return role.preset != null && STATUS_PRESETS.includes(role.preset);
}

/** Roles that belong to the Colors tab (not Neutral, not Status). */
function isColorRole(role: ColorRole): boolean {
	return role.preset !== "neutral" && !isStatusRole(role);
}

const sidebarTabClass = cn(
	"text-foreground h-10 w-full flex-none justify-start rounded-md px-4 text-left text-base font-semibold transition-colors",
	"hover:bg-muted hover:text-foreground dark:text-foreground",
	"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
	"dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent",
	"group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none",
	"after:hidden",
);

type EmptyTabCardProps = {
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
};

/** Placeholder shown in a tab whose scales/fonts have not been added yet. */
function EmptyTabCard({
	title,
	description,
	actionLabel,
	onAction,
}: EmptyTabCardProps): JSX.Element {
	return (
		<div className="border-muted-foreground flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
			<div className="flex flex-col gap-1">
				<h2 className="text-foreground text-base font-semibold">{title}</h2>
				<p className="text-muted-foreground max-w-prose text-sm">
					{description}
				</p>
			</div>
			{actionLabel && onAction ? (
				<Button onClick={onAction}>{actionLabel}</Button>
			) : null}
		</div>
	);
}

/**
 * Top-level client orchestrator. Owns the ordered list of color roles; every
 * palette and CSS variable is derived from them, and the URL is kept in sync so
 * the whole theme is shareable.
 */
export function PaletteGenerator({
	initialTheme,
	initialTypography,
	aiEnabled = false,
	aiDefaultModel,
	applyToSiteEnabled = false,
}: PaletteGeneratorProps): JSX.Element {
	const [roles, setRoles] = useState<Array<ColorRole>>(initialTheme.roles);
	const [semanticNamesLocked, setSemanticNamesLocked] = useState(
		initialTheme.semanticNamesLocked ?? false,
	);
	const [typography, setTypography] = useState<Typography>(
		initialTypography ?? defaultTypography(),
	);
	// The Typography panel is opt-in via the Add menu, except when a shared URL
	// already carries non-default typography.
	const [showTypography, setShowTypography] = useState<boolean>(
		() => initialTypography != null && !isDefaultTypography(initialTypography),
	);
	const [tabIndex, setTabIndex] = useState<number>(TAB_COLORS);
	// Pill index (within the color roles) currently being dragged, if any.
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [isExportOpen, setExportOpen] = useState<boolean>(false);
	const [isPreviewOpen, setPreviewOpen] = useState<boolean>(false);
	const [isImportOpen, setImportOpen] = useState<boolean>(false);
	const [isStitchImportOpen, setStitchImportOpen] = useState<boolean>(false);
	const [stitchSpec, setStitchSpec] = useState<StitchSpec | null>(null);
	const [applyToSite, setApplyToSite] = useState<boolean>(false);
	const [aiSiteVars, setAiSiteVars] = useState<AiSiteTheme | null>(null);
	const [aiPending, setAiPending] = useState<boolean>(false);
	const [aiError, setAiError] = useState<string>("");
	const aiGenerationRef = useRef<number>(0);
	const aiAbortRef = useRef<AbortController | null>(null);
	const { copiedKey, copy } = useCopyToClipboard();

	const primaryHex = roles[0]?.hex ?? "#000000";

	const effectiveTheme = useMemo<Theme>(
		() => ({
			roles: roles.map((role) => ({
				...role,
				hex: effectiveHex(role, primaryHex),
			})),
			semanticNamesLocked,
		}),
		[roles, primaryHex, semanticNamesLocked],
	);

	const palettes = useMemo<Array<Palette>>(
		() =>
			effectiveTheme.roles.map((role) => generatePalette(role.hex, role.name)),
		[effectiveTheme],
	);
	const rampVars = useMemo(() => themeToCssVars(palettes), [palettes]);
	const siteVars = useMemo(
		() => ({
			light: siteThemeVars({
				roles: effectiveTheme.roles,
				palettes,
				typography,
				scheme: "light",
			}),
			dark: siteThemeVars({
				roles: effectiveTheme.roles,
				palettes,
				typography,
				scheme: "dark",
			}),
		}),
		[effectiveTheme, palettes, typography],
	);
	const appliedSiteVars = useMemo(
		() => ({
			light: enforceThemeContrast({
				...rampVars,
				...siteVars.light,
				...(aiSiteVars?.light ?? {}),
			}),
			dark: enforceThemeContrast({
				...rampVars,
				...siteVars.dark,
				...(aiSiteVars?.dark ?? {}),
			}),
		}),
		[aiSiteVars, rampVars, siteVars],
	);
	const aiRoles = useMemo(
		() =>
			withUniqueSlugs(palettes).map(({ slug }, index) => ({
				name: effectiveTheme.roles[index]?.name ?? slug,
				slug,
				preset: effectiveTheme.roles[index]?.preset ?? null,
			})),
		[effectiveTheme.roles, palettes],
	);
	useSiteTheme(applyToSite, appliedSiteVars);

	useEffect(
		() => () => {
			aiAbortRef.current?.abort();
		},
		[],
	);

	// Reflect the full theme into the URL without a server round-trip, leaving the
	// initial address untouched until the user changes something.
	const isFirstRender = useRef<boolean>(true);
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		if (typeof window !== "undefined") {
			window.history.replaceState(
				null,
				"",
				buildThemeHref(effectiveTheme, typography),
			);
		}
	}, [effectiveTheme, typography]);

	const isFirstAiInvalidation = useRef<boolean>(true);
	useEffect(() => {
		if (isFirstAiInvalidation.current) {
			isFirstAiInvalidation.current = false;
			return;
		}
		aiGenerationRef.current += 1;
		aiAbortRef.current?.abort();
		aiAbortRef.current = null;
		setAiPending(false);
		setAiSiteVars(null);
		setAiError("");
	}, [effectiveTheme, typography]);

	// Spacebar randomizes the primary, unless typing in a field.
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent): void {
			const tag = (event.target as HTMLElement | null)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") {
				return;
			}
			if (event.code === "Space") {
				event.preventDefault();
				setRoles((prev) =>
					prev.map((role, index) =>
						index === 0 && !role.locked ? { ...role, hex: randomHex() } : role,
					),
				);
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	function patchRole(id: string, patch: Partial<ColorRole>): void {
		setRoles((prev) =>
			prev.map((role) => (role.id === id ? { ...role, ...patch } : role)),
		);
	}

	function handleHexChange(id: string, hex: string): void {
		patchRole(id, { hex, auto: false });
	}

	function handleNameChange(id: string, name: string): void {
		patchRole(id, { name });
		setSemanticNamesLocked(false);
	}

	function handleSemanticNameChange(
		id: string,
		shade: Shade,
		name: string,
	): void {
		setRoles((prev) =>
			prev.map((role) => {
				if (role.id !== id) return role;
				const semanticNames = { ...role.semanticNames };
				if (name) semanticNames[shade] = name;
				else delete semanticNames[shade];
				return { ...role, semanticNames };
			}),
		);
		setSemanticNamesLocked(false);
	}

	function handleBulkSemanticNameChange(
		id: string,
		name: string,
		applyShadeNumbers = false,
	): void {
		setRoles((prev) =>
			prev.map((role) => {
				if (role.id !== id) return role;
				const semanticNames = { ...role.semanticNames };
				for (const { shade } of generatePalette(role.hex).shades) {
					if (name) {
						semanticNames[shade] = applyShadeNumbers
							? `${name}-${shade}`
							: name;
					}
					else delete semanticNames[shade];
				}
				return { ...role, semanticNames };
			}),
		);
		setSemanticNamesLocked(false);
	}

	function handleToggleAuto(id: string): void {
		setRoles((prev) =>
			prev.map((role) => {
				if (role.id !== id) {
					return role;
				}
				if (role.auto) {
					// Turning off: freeze the currently-derived color.
					return { ...role, auto: false, hex: effectiveHex(role, primaryHex) };
				}
				return { ...role, auto: true };
			}),
		);
	}

	function handleToggleLocked(id: string): void {
		setRoles((prev) =>
			prev.map((role) =>
				role.id === id ? { ...role, locked: !role.locked } : role,
			),
		);
	}

	function handleRemove(id: string): void {
		setRoles((prev) => {
			if (prev.length <= 1) {
				return prev;
			}
			const next = prev.filter((role) => role.id !== id);
			if (next.length === prev.length) {
				return prev;
			}
			// Removing the primary promotes the next role. A primary can't be
			// auto-derived or belong to the Neutral/Status groups, so freeze its
			// current color and drop its preset.
			if (prev[0]?.id === id) {
				const promoted = next[0];
				next[0] = {
					...promoted,
					auto: false,
					preset: undefined,
					hex: effectiveHex(promoted, prev[0].hex),
				};
			}
			return next;
		});
		setSemanticNamesLocked(false);
		trackEvent("color_role_removed");
	}

	function handleAddPreset(preset: PresetKey): void {
		setRoles((prev) => [...prev, createPresetRole(preset, primaryHex)]);
		trackEvent("color_role_added", { preset });
		if (preset === "neutral") {
			setTabIndex(TAB_NEUTRAL);
		} else if (STATUS_PRESETS.includes(preset)) {
			setTabIndex(TAB_STATUS);
		} else {
			setTabIndex(TAB_COLORS);
		}
	}

	function handleAddCustom(): void {
		setRoles((prev) => {
			const position = prev.filter(isColorRole).length;
			const role = {
				...createCustomRole(randomHex(), position),
				name: positionalName(position),
			};
			return [...prev, role];
		});
		trackEvent("color_role_added", { preset: "custom" });
		setTabIndex(TAB_COLORS);
	}

	// Reorder the color roles (pill drag). The first pill is the primary, so a
	// new leader is frozen like in handleRemove's promotion; roles whose names
	// are still positional defaults are renamed to match their new position.
	function handleReorderColors(from: number, to: number): void {
		if (from === to) {
			return;
		}
		setRoles((prev) => {
			const colorRoles = prev.filter(isColorRole);
			const otherRoles = prev.filter((role) => !isColorRole(role));
			if (from < 0 || from >= colorRoles.length || to >= colorRoles.length) {
				return prev;
			}
			const moved = [...colorRoles];
			const [dragged] = moved.splice(from, 1);
			moved.splice(to, 0, dragged);
			if (moved[0].id !== colorRoles[0].id) {
				moved[0] = {
					...moved[0],
					auto: false,
					preset: undefined,
					hex: effectiveHex(moved[0], prev[0]?.hex ?? moved[0].hex),
				};
			}
			const renamed = moved.map((role, position) =>
				isDefaultName(role.name)
					? { ...role, name: positionalName(position) }
					: role,
			);
			return [...renamed, ...otherRoles];
		});
	}

	// Adds whichever of success/warning/error are not present yet. Computed
	// inside the updater so a double-click cannot append duplicates.
	function handleAddStatus(): void {
		setRoles((prev) => {
			const missing = STATUS_PRESETS.filter(
				(preset) => !prev.some((role) => role.preset === preset),
			);
			if (missing.length === 0) {
				return prev;
			}
			const baseHex = prev[0]?.hex ?? "#000000";
			return [
				...prev,
				...missing.map((preset) => createPresetRole(preset, baseHex)),
			];
		});
		trackEvent("color_role_added", { preset: "status" });
		setTabIndex(TAB_STATUS);
	}

	function handleAddFonts(): void {
		setShowTypography(true);
		trackEvent("typography_changed");
		setTabIndex(TAB_FONTS);
	}

	function handleRemoveTypography(): void {
		setShowTypography(false);
		// Reset so the URL's ?type= param drops via the sync effect.
		setTypography(defaultTypography());
		trackEvent("typography_changed");
	}

	function handleStitchImport(spec: StitchSpec): void {
		setStitchSpec(spec);
		// Seed the role generator from the spec's anchor colors so the existing
		// palette/preview/export pipeline keeps working (mirrors handleAiApply).
		setRoles(stitchToTheme(spec).roles);
		trackEvent("stitch_imported");
	}

	function handleImport(colors: ReadonlyArray<ImportedColor>): void {
		if (colors.length === 0) {
			return;
		}
		setRoles(
			colors.map((color, index) => {
				const role =
					index === 0
						? createPrimaryRole(color.hex)
						: createCustomRole(color.hex, index);
				// JSON imports (e.g. uicolors.app) carry palette names; keep them.
				return color.name
					? { ...role, name: color.name }
					: { ...role, name: positionalName(index) };
			}),
		);
		setTabIndex(TAB_COLORS);
		trackEvent("palette_imported", { role_count: colors.length });
	}

	// Randomize every color-tab role that owns its hex. Auto roles keep
	// deriving from the new primary; neutral and status keep their semantic
	// hues.
	function handleRandom(): void {
		setRoles((prev) =>
			prev.map((role) =>
				isColorRole(role) && !role.auto && !role.locked
					? { ...role, hex: randomHex() }
					: role,
			),
		);
		trackEvent("random_palette");
	}

	function handleReset(): void {
		setRoles(defaultTheme().roles);
		setTypography(defaultTypography());
		setShowTypography(false);
		setTabIndex(TAB_COLORS);
		setDragIndex(null);
		setExportOpen(false);
		setPreviewOpen(false);
		setImportOpen(false);
		setStitchImportOpen(false);
		setStitchSpec(null);
		setAiSiteVars(null);
		setAiError("");
		aiGenerationRef.current += 1;
		aiAbortRef.current?.abort();
		aiAbortRef.current = null;
		setAiPending(false);
		trackEvent("generator_reset");
	}

	async function handleAiApply(): Promise<void> {
		if (aiPending) {
			return;
		}
		const generation = aiGenerationRef.current + 1;
		aiGenerationRef.current = generation;
		aiAbortRef.current?.abort();
		const controller = new AbortController();
		aiAbortRef.current = controller;
		setAiPending(true);
		setAiError("");

		try {
			const response = await fetch("/api/site-theme", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				signal: controller.signal,
				body: JSON.stringify({
					rampVars,
					roles: aiRoles,
					model: aiDefaultModel,
				}),
			});
			if (!response.ok) {
				throw new Error("AI theme request failed");
			}
			const nextVars = (await response.json()) as AiSiteTheme;
			if (aiGenerationRef.current !== generation) {
				return;
			}
			setAiSiteVars({
				light: nextVars.light ?? {},
				dark: nextVars.dark ?? {},
			});
			setApplyToSite(true);
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				return;
			}
			if (aiGenerationRef.current === generation) {
				setAiError("Could not apply AI theme.");
			}
		} finally {
			if (aiGenerationRef.current === generation) {
				setAiPending(false);
				aiAbortRef.current = null;
			}
		}
	}

	// Role scales (`--slug-shade`) plus, when a Stitch spec is loaded, its flat
	// MD3 tokens (`--surface`, …) in a separate namespace. Merged here so every
	// downstream consumer (preview overlay, templates, AI iframe) sees both.
	const cssVars = useMemo(
		() => ({
			...rampVars,
			...(stitchSpec ? stitchToCssVars(stitchSpec) : {}),
		}),
		[rampVars, stitchSpec],
	);
	const themeStyle = cssVars as unknown as CSSProperties;

	// Group the roles into the Colors / Neutral / Status tabs, keeping each
	// role's index into `roles`/`palettes` so panels and primary detection work.
	const entries = roles.map((role, index) => ({ role, index }));
	const colorEntries = entries.filter(({ role }) => isColorRole(role));
	const neutralEntries = entries.filter(
		({ role }) => role.preset === "neutral",
	);
	const statusEntries = entries.filter(({ role }) => isStatusRole(role));

	const renderRolePanel = ({
		role,
		index,
		roleLabel,
	}: {
		role: ColorRole;
		index: number;
		roleLabel?: string;
	}): JSX.Element => (
		<ColorRolePanel
			key={role.id}
			role={role}
			palette={palettes[index]}
			isPrimary={index === 0}
			roleLabel={roleLabel}
			canRemove={roles.length > 1}
			copiedKey={copiedKey}
			onCopy={(hex) => copy(hex, hex)}
			onNameChange={handleNameChange}
			onHexChange={handleHexChange}
			onToggleAuto={handleToggleAuto}
			onToggleLocked={handleToggleLocked}
			onRemove={handleRemove}
			onSemanticNameChange={handleSemanticNameChange}
			onBulkSemanticNameChange={handleBulkSemanticNameChange}
		/>
	);

	const renderDraggableColorPanel = (
		{ role, index }: { role: ColorRole; index: number },
		position: number,
	): JSX.Element => (
		<div
			key={role.id}
			className={`flex items-stretch gap-2 ${
				dragIndex === position ? "opacity-70" : ""
			}`}
		>
			<button
				type="button"
				draggable
				data-testid="color-card-drag-handle"
				aria-label={`Drag ${role.name} color`}
				title="Drag to reorder"
				onDragStart={() => setDragIndex(position)}
				onDragOver={(event) => event.preventDefault()}
				onDrop={(event) => {
					event.preventDefault();
					if (dragIndex !== null) {
						handleReorderColors(dragIndex, position);
					}
					setDragIndex(null);
				}}
				onDragEnd={() => setDragIndex(null)}
				// Tinted with the role's own scale: 200 as fill, 700 for the dots
				// (the fill stays light in both schemes, so the dots stay dark).
				style={{
					backgroundColor: palettes[index]?.shades.find(
						(entry) => entry.shade === 200,
					)?.hex,
					color: palettes[index]?.shades.find((entry) => entry.shade === 700)
						?.hex,
				}}
				className="border-border bg-muted text-muted-foreground/70 hover:border-input flex w-9 shrink-0 cursor-grab items-center justify-center rounded-lg border transition-colors active:cursor-grabbing"
			>
				<span aria-hidden="true" className="grid grid-cols-2 gap-1">
					<span className="h-1 w-1 rounded-full bg-current" />
					<span className="h-1 w-1 rounded-full bg-current" />
					<span className="h-1 w-1 rounded-full bg-current" />
					<span className="h-1 w-1 rounded-full bg-current" />
					<span className="h-1 w-1 rounded-full bg-current" />
					<span className="h-1 w-1 rounded-full bg-current" />
				</span>
			</button>
			<div className="min-w-0 flex-1">
				{renderRolePanel({ role, index, roleLabel: positionalName(position) })}
			</div>
		</div>
	);

	return (
		<div
			className="flex flex-none flex-col md:min-h-0 md:flex-1"
			style={themeStyle}
		>
			<FontPreviewLoader />

			<Tabs
				value={TAB_VALUES[tabIndex] ?? "color"}
				onValueChange={(value) => {
					const index = TAB_VALUES.indexOf(
						value as (typeof TAB_VALUES)[number],
					);
					setTabIndex(index === -1 ? TAB_COLORS : index);
				}}
				className="flex-none gap-0 md:min-h-0 md:flex-1"
			>
				<div className="mb-3 flex shrink-0 flex-wrap items-center gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={handleRandom}
							className={toolbarButtonClass.outline}
						>
							Random
						</button>
						<button
							type="button"
							onClick={handleReset}
							className={toolbarButtonClass.outline}
						>
							Reset
						</button>
						<ImportMenu
							onImportColor={() => {
								setImportOpen(true);
								trackEvent("import_opened", { source: "color" });
							}}
							onImportStitch={() => {
								setStitchImportOpen(true);
								trackEvent("import_opened", { source: "stitch" });
							}}
						/>
					</div>
					<div className="ml-auto flex flex-wrap items-center gap-2">
						<SavePaletteButton theme={effectiveTheme} typography={typography} />
						{aiEnabled ? (
							<button
								type="button"
								data-testid="ai-theme-button"
								aria-busy={aiPending}
								disabled={aiPending}
								onClick={() => void handleAiApply()}
								className={toolbarButtonClass.outline}
							>
								{aiPending ? (
									<Spinner label="Applying AI theme" />
								) : (
									<>
										<span aria-hidden="true" className="mr-2">
											✦
										</span>
										AI theme
									</>
								)}
							</button>
						) : null}
						{applyToSiteEnabled ? (
							<Toggle
								variant="outline"
								data-testid="apply-to-site-toggle"
								pressed={applyToSite}
								onPressedChange={setApplyToSite}
								className="bg-card hover:text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary-hover data-[state=on]:hover:text-primary-foreground h-10 px-4 text-base font-semibold"
							>
								<span
									data-testid="apply-to-site-toggle-icon"
									data-state={applyToSite ? "on" : "off"}
									aria-hidden="true"
									className="mr-2 inline-flex"
								>
									{applyToSite ? (
										<CircleDot className="h-4 w-4" />
									) : (
										<Circle className="h-4 w-4" />
									)}
								</span>
								Apply to site
							</Toggle>
						) : null}
						<button
							type="button"
							onClick={() => {
								setPreviewOpen(true);
								trackEvent("preview_opened", { preview: "default" });
							}}
							className={toolbarButtonClass.outline}
						>
							Preview
						</button>
						<Button
							aria-label="Export"
							onClick={() => {
								setExportOpen(true);
								trackEvent("export_dialog_opened");
							}}
							className={toolbarButtonClass.primaryWide}
						>
							Export
						</Button>
					</div>
					{aiError ? (
						<div
							role="alert"
							className="border-destructive/30 bg-destructive/10 text-destructive basis-full rounded-md border px-3 py-2 text-sm"
						>
							{aiError}
						</div>
					) : null}
				</div>

				<div
					data-testid="generator-workspace"
					className="relative flex flex-none flex-col gap-3 overflow-visible md:min-h-0 md:flex-1 md:flex-row md:overflow-hidden"
				>
					<aside
						data-testid="generator-sidebar-lane"
						className="border-input bg-card flex shrink-0 flex-col rounded-md border p-5 md:w-80"
					>
						<TabsList
							aria-label="Generator sections"
							className="text-foreground flex w-full flex-col items-stretch justify-start gap-2 overflow-visible rounded-none bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto"
						>
							<TabsTrigger
								value="color"
								id="generator-section-tab-color"
								data-testid="generator-section-tab-color"
								className={sidebarTabClass}
							>
								Color
							</TabsTrigger>
							<TabsTrigger
								value="neutral"
								id="generator-section-tab-neutral"
								data-testid="generator-section-tab-neutral"
								className={sidebarTabClass}
							>
								Neutral
								<span data-slot="info-tip-anchor" className="ml-auto pl-3">
									<InfoTip text="Use Neutral for app surfaces, borders, muted backgrounds, and readable text." />
								</span>
							</TabsTrigger>
							<TabsTrigger
								value="status"
								id="generator-section-tab-status"
								data-testid="generator-section-tab-status"
								className={sidebarTabClass}
							>
								Status
								<span data-slot="info-tip-anchor" className="ml-auto pl-3">
									<InfoTip text="Use Status for success, warning, and destructive feedback states." />
								</span>
							</TabsTrigger>
							<div
								aria-hidden="true"
								data-testid="generator-sidebar-divider"
								className="border-input hidden border-t md:my-3 md:block"
							/>
							<TabsTrigger
								value="font"
								id="generator-section-tab-font"
								data-testid="generator-section-tab-font"
								className={sidebarTabClass}
							>
								Font
							</TabsTrigger>
						</TabsList>
						<ul
							data-testid="generator-sidebar-caption"
							className="text-muted-foreground border-input mt-4 list-disc space-y-1.5 rounded-md border p-4 pl-8 text-sm md:mt-auto"
						>
							{siteConfig.caption.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</aside>

					<div
						data-testid="workspace-content"
						className="border-input bg-card relative flex min-w-0 flex-none flex-col overflow-visible rounded-md border md:flex-1 md:overflow-hidden"
					>
						<PreviewOverlay
							open={isPreviewOpen}
							onOpenChange={setPreviewOpen}
							cssVars={cssVars}
							typography={typography}
							palettes={palettes}
						/>
						<div
							data-testid="workspace-scroll-area"
							className="workspace-scroll-area flex-none overflow-y-visible md:min-h-0 md:flex-1 md:overflow-y-auto"
						>
							<TabsContent
								value="color"
								id="generator-section-panel-color"
								data-testid="generator-section-panel-color"
								className="flex min-h-full flex-col focus:outline-none"
							>
								<div className="flex flex-col gap-4 p-5 md:p-6">
									{/* Drag a pill to reorder; the first position is the primary. */}
									<div className="flex flex-wrap items-center gap-2">
										{colorEntries.map(({ role }, position) => (
											<span
												key={role.id}
												draggable
												data-testid="color-pill"
												title="Drag to reorder"
												onDragStart={() => setDragIndex(position)}
												onDragOver={(event) => event.preventDefault()}
												onDrop={(event) => {
													event.preventDefault();
													if (dragIndex !== null) {
														handleReorderColors(dragIndex, position);
													}
													setDragIndex(null);
												}}
												onDragEnd={() => setDragIndex(null)}
												className={`text-foreground flex cursor-grab items-center gap-2 rounded-full border py-1 pr-3 pl-1.5 text-base font-medium active:cursor-grabbing ${
													dragIndex === position
														? "border-muted-foreground opacity-60"
														: "border-input"
												}`}
											>
												<span
													className="h-5 w-5 rounded-full border border-black/10 dark:border-white/10"
													style={{
														backgroundColor: effectiveHex(role, primaryHex),
													}}
													aria-hidden="true"
												/>
												{role.name}
											</span>
										))}
									</div>

					{colorEntries.map(renderDraggableColorPanel)}
								</div>

								<div
									data-testid="color-sticky-footer"
									className={stickyFooterClass}
								>
									<button
										type="button"
										data-testid="add-custom"
										onClick={handleAddCustom}
										className={addButtonClass}
									>
										Add Color
									</button>
								</div>
							</TabsContent>

							<TabsContent
								value="neutral"
								id="generator-section-panel-neutral"
								data-testid="generator-section-panel-neutral"
								className="flex min-h-full flex-col focus:outline-none"
							>
								<div className="flex flex-col gap-4 p-5 md:p-6">
									{neutralEntries.map(renderRolePanel)}
									{neutralEntries.length === 0 ? (
										<EmptyTabCard
											title="Neutral"
											description="Add a custom neutral color scale for standard UI elements like text, borders, and surfaces."
										/>
									) : null}
								</div>

								<div
									data-testid="neutral-sticky-footer"
									className={stickyFooterClass}
								>
									<button
										type="button"
										data-testid="add-neutral"
										onClick={() => handleAddPreset("neutral")}
										className={addButtonClass}
									>
										Add Neutral
									</button>
								</div>
							</TabsContent>

							<TabsContent
								value="status"
								id="generator-section-panel-status"
								data-testid="generator-section-panel-status"
								className="flex min-h-full flex-col focus:outline-none"
							>
								<div className="flex flex-col gap-4 p-5 md:p-6">
									{statusEntries.map(renderRolePanel)}
									{statusEntries.length === 0 ? (
										<EmptyTabCard
											title="Status"
											description="Add success, warning, and error color scales and preview them right inside the Components tab."
										/>
									) : null}
								</div>

								<div
									data-testid="status-sticky-footer"
									className={stickyFooterClass}
								>
									<button
										type="button"
										data-testid="add-status"
										onClick={handleAddStatus}
										className={addButtonClass}
									>
										Add Status
									</button>
								</div>
							</TabsContent>

							<TabsContent
								value="font"
								id="generator-section-panel-font"
								data-testid="generator-section-panel-font"
								className="flex min-h-full flex-col focus:outline-none"
							>
								{showTypography ? (
									<TypographyPanel
										typography={typography}
										onChange={setTypography}
										onRemove={handleRemoveTypography}
									/>
								) : (
									<>
										<div className="flex flex-col gap-4 p-5 md:p-6">
											<EmptyTabCard
												title="Font"
												description="Pick a font pairing and type scale for your theme."
											/>
										</div>

										<div
											data-testid="font-sticky-footer"
											className={stickyFooterClass}
										>
											<button
												type="button"
												data-testid="add-fonts"
												onClick={handleAddFonts}
												className={addButtonClass}
											>
												Add Fonts
											</button>
										</div>
									</>
								)}
							</TabsContent>
						</div>
					</div>
				</div>
			</Tabs>

			{stitchSpec ? <StitchTokensPanel spec={stitchSpec} /> : null}

			<ImportPaletteDialog
				open={isImportOpen}
				onOpenChange={setImportOpen}
				onImport={handleImport}
				requiresConfirmation={roles.length > 0}
			/>

			<ImportStitchDialog
				open={isStitchImportOpen}
				onOpenChange={setStitchImportOpen}
				onImportStitch={handleStitchImport}
			/>

			<ExportDialog
				palettes={palettes}
				roles={roles}
				typography={typography}
				stitchSpec={stitchSpec}
				open={isExportOpen}
				onOpenChange={setExportOpen}
				semanticNamesLocked={semanticNamesLocked}
				onSemanticNameChange={handleSemanticNameChange}
				onLockSemanticNames={() => setSemanticNamesLocked(true)}
			/>
		</div>
	);
}
