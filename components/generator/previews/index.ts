import type { JSX } from "react";

import type { Palette } from "@/lib/color";
import type { Typography } from "@/lib/typography";
import { DesignSystemPreview } from "@/components/generator/previews/designsystem";
import { ComponentsPreview } from "@/components/generator/previews/components";
import { DashboardPreview } from "@/components/generator/previews/dashboard";
import { CardsPreview } from "@/components/generator/previews/cards";
import { WebsitePreview } from "@/components/generator/previews/website";
import { ChartsPreview } from "@/components/generator/previews/charts";
import { TypographyPreview } from "@/components/generator/previews/typography";
import { GradientsPreview } from "@/components/generator/previews/gradients";
import { BrandingPreview } from "@/components/generator/previews/branding";
import { MaterialPreview } from "@/components/generator/previews/material";

/** Props every preview template receives. */
export type PreviewProps = {
	typography: Typography;
	palettes: ReadonlyArray<Palette>;
};

export type PreviewComponent = (props: PreviewProps) => JSX.Element;

export type PreviewKey =
	| "designsystem"
	| "components"
	| "dashboard"
	| "cards"
	| "website"
	| "charts"
	| "typography"
	| "gradients"
	| "branding"
	| "material";

export const PREVIEW_TEMPLATES: ReadonlyArray<{
	key: PreviewKey;
	label: string;
	Component: PreviewComponent;
}> = [
	{ key: "designsystem", label: "Design system", Component: DesignSystemPreview },
	{ key: "components", label: "Components", Component: ComponentsPreview },
	{ key: "dashboard", label: "Dashboard", Component: DashboardPreview },
	{ key: "cards", label: "Cards", Component: CardsPreview },
	{ key: "website", label: "Website", Component: WebsitePreview },
	{ key: "charts", label: "Charts", Component: ChartsPreview },
	{ key: "typography", label: "Typography", Component: TypographyPreview },
	{ key: "gradients", label: "Gradients", Component: GradientsPreview },
	{ key: "branding", label: "Branding", Component: BrandingPreview },
	{ key: "material", label: "Material", Component: MaterialPreview },
];

export const DEFAULT_PREVIEW_KEY: PreviewKey = "designsystem";

const PREVIEW_KEYS = new Set<string>(PREVIEW_TEMPLATES.map((t) => t.key));

/** Narrow an arbitrary string to a known preview key. */
export function isPreviewKey(value: string | null | undefined): value is PreviewKey {
	return typeof value === "string" && PREVIEW_KEYS.has(value);
}
