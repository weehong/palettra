import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { generatePalette } from "@/lib/color";
import { defaultTheme } from "@/lib/theme";
import { defaultTypography } from "@/lib/typography";
import { PaletteGenerator } from "@/components/generator/palette-generator";

const writeText = vi.fn<(text: string) => Promise<void>>(() =>
	Promise.resolve(),
);

beforeEach(() => {
	writeText.mockClear();
	vi.unstubAllGlobals();
	Object.defineProperty(navigator, "clipboard", {
		value: { writeText },
		configurable: true,
	});
});

function renderGenerator(
	props: Partial<Parameters<typeof PaletteGenerator>[0]> = {},
) {
	return render(
		<PaletteGenerator initialTheme={defaultTheme("#a543bc")} {...props} />,
	);
}

function chooseFont(picker: HTMLElement, name: string): void {
	// Options live in a portaled popover; Radix keeps a single popover open, so
	// the visible option list always belongs to the picker just clicked.
	fireEvent.click(picker);
	fireEvent.click(screen.getByRole("option", { name }));
}

function selectGeneratorTab(name: string): void {
	// Radix tabs select on a left-button mouseDown.
	fireEvent.mouseDown(screen.getByRole("tab", { name }), {
		button: 0,
		ctrlKey: false,
	});
}

describe("PaletteGenerator", () => {
	it("renders the action bar above the generator workspace", () => {
		renderGenerator();
		const workspace = screen.getByTestId("generator-workspace");
		const randomButton = screen.getByRole("button", { name: "Random" });

		expect(workspace).toBeInTheDocument();
		expect(workspace).toHaveClass("min-h-0", "flex-1");
		expect(workspace).not.toHaveClass("h-[calc(100vh-13rem)]");
		expect(workspace).not.toContainElement(randomButton);
		expect(
			randomButton.compareDocumentPosition(workspace) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(
			screen.getByRole("tablist", { name: "Generator sections" }),
		).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Color" })).toHaveClass(
			"h-10",
			"rounded-md",
		);
		expect(screen.getByRole("button", { name: "Export" })).toHaveClass("h-10");
	});

	it("uses neutral outline styling for toolbar actions and primary for the CTA", () => {
		renderGenerator({ aiEnabled: true });

		for (const name of ["Random", "Reset", "Preview"]) {
			expect(screen.getByRole("button", { name })).toHaveClass(
				"border-input",
				"bg-card",
				"text-foreground",
			);
		}
		expect(screen.getByTestId("ai-theme-button")).toHaveClass(
			"border-input",
			"bg-card",
			"text-foreground",
		);
		expect(screen.getByRole("button", { name: "Export" })).toHaveClass(
			"bg-primary",
			"text-primary-foreground",
		);
	});

	it("keeps large export output contained inside the dialog viewport", () => {
		renderGenerator();

		fireEvent.click(screen.getByRole("button", { name: "Export" }));
		fireEvent.mouseDown(screen.getByRole("tab", { name: "Figma (tokens)" }), {
			button: 0,
			ctrlKey: false,
		});

		const dialog = screen.getByRole("dialog", { name: "Export theme" });
		expect(dialog).toHaveClass(
			"max-h-[calc(100dvh-2rem)]",
			"overflow-hidden",
			"grid-rows-[auto_auto_minmax(0,1fr)_auto]",
		);
		const codePreview = dialog.querySelector("pre");
		expect(codePreview).not.toBeNull();
		expect(codePreview as HTMLElement).toHaveClass(
			"min-h-0",
			"max-h-none",
			"max-w-full",
			"overflow-auto",
		);
	});

	it("renders the Apply to site toolbar toggle when enabled", () => {
		renderGenerator({ applyToSiteEnabled: true });
		const toggle = screen.getByTestId("apply-to-site-toggle");
		const icon = screen.getByTestId("apply-to-site-toggle-icon");

		expect(toggle).toHaveTextContent("Apply to site");
		expect(toggle).toHaveAttribute("aria-pressed", "false");
		expect(icon).toHaveAttribute("data-state", "off");

		fireEvent.click(toggle);

		expect(toggle).toHaveAttribute("aria-pressed", "true");
		expect(icon).toHaveAttribute("data-state", "on");
		expect(
			document.documentElement.style.getPropertyValue("--primary"),
		).toMatch(/^#[0-9a-f]{6}$/);

		fireEvent.click(toggle);

		expect(toggle).toHaveAttribute("aria-pressed", "false");
		expect(document.documentElement.style.getPropertyValue("--primary")).toBe(
			"",
		);
	});

	it("explains the Neutral and Status sections without changing tab names", () => {
		renderGenerator();

		expect(screen.getByRole("tab", { name: "Neutral" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Status" })).toBeInTheDocument();
		const neutralTab = screen.getByTestId("generator-section-tab-neutral");
		const statusTab = screen.getByTestId("generator-section-tab-status");
		expect(neutralTab).toHaveTextContent(
			"Use Neutral for app surfaces, borders, muted backgrounds, and readable text.",
		);
		expect(statusTab).toHaveTextContent(
			"Use Status for success, warning, and destructive feedback states.",
		);
		expect(
			neutralTab.querySelector('[data-slot="info-tip-anchor"]'),
		).toHaveClass("ml-auto");
		expect(
			statusTab.querySelector('[data-slot="info-tip-anchor"]'),
		).toHaveClass("ml-auto");
		// whitespace-normal beats the trigger's inherited whitespace-nowrap so
		// the tooltip wraps inside its w-64 box instead of clipping mid-sentence.
		expect(
			neutralTab.querySelector('[data-slot="info-tip-content"]'),
		).toHaveClass("right-0", "whitespace-normal", "w-64");
		expect(
			statusTab.querySelector('[data-slot="info-tip-content"]'),
		).toHaveClass("right-0", "whitespace-normal", "w-64");
		// The tab list must not clip the tooltip on desktop (it is a horizontal
		// scroll container only on mobile).
		expect(
			screen.getByRole("tablist", { name: "Generator sections" }),
		).toHaveClass("md:overflow-visible");
	});

	it("tints each color card with its own 50 shade", () => {
		renderGenerator();
		const section = screen.getByRole("region", { name: "Primary color" });
		const shade50 = generatePalette("#a543bc").shades[0];

		expect(shade50.shade).toBe(50);
		expect(section).toHaveStyle({ backgroundColor: shade50.hex });
	});

	it("does not render the AI theme button unless AI is enabled", () => {
		renderGenerator();

		expect(screen.queryByTestId("ai-theme-button")).not.toBeInTheDocument();
	});

	it("does not render the Apply to site toggle unless enabled", () => {
		renderGenerator();

		expect(
			screen.queryByTestId("apply-to-site-toggle"),
		).not.toBeInTheDocument();
	});

	it("renders the AI theme button when AI is enabled", () => {
		renderGenerator({ aiEnabled: true });

		expect(screen.getByTestId("ai-theme-button")).toHaveTextContent("AI theme");
	});

	it("applies AI theme vars with ramp vars and turns on Apply to site", async () => {
		const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
			void args;
			return Response.json({
				light: { "--background": "#111111", "--foreground": "#ffffff" },
				dark: { "--background": "#000000", "--foreground": "#ffffff" },
			});
		});
		vi.stubGlobal("fetch", fetchMock);
		renderGenerator({
			aiEnabled: true,
			aiDefaultModel: "test/model",
			applyToSiteEnabled: true,
		});

		fireEvent.click(screen.getByTestId("ai-theme-button"));

		await waitFor(() => {
			expect(
				document.documentElement.style.getPropertyValue("--background"),
			).toBe("#111111");
		});
		expect(screen.getByTestId("apply-to-site-toggle")).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(
			document.documentElement.style.getPropertyValue("--primary-50"),
		).toMatch(/^#[0-9a-f]{6}$/);

		const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string) as {
			model?: string;
			rampVars?: Record<string, string>;
			roles?: Array<{ name: string; slug: string; preset: string | null }>;
		};
		expect(body.model).toBe("test/model");
		expect(body.rampVars).toHaveProperty("--primary-50");
		expect(body.roles?.[0]).toEqual({
			name: "Primary",
			slug: "primary",
			preset: null,
		});
	});

	it("shows a circular spinner while applying the AI site theme", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => new Promise<Response>(() => {})),
		);
		renderGenerator({ aiEnabled: true });

		fireEvent.click(screen.getByTestId("ai-theme-button"));

		expect(
			await screen.findByRole("status", { name: "Applying AI theme" }),
		).toHaveClass("animate-spin");
		expect(
			screen.getByRole("button", { name: "Applying AI theme" }),
		).toHaveAttribute("aria-busy", "true");
		expect(screen.queryByText("Applying...")).not.toBeInTheDocument();
	});

	it("shows an alert and leaves site vars unapplied when AI theme fetch fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => Response.json({ error: "nope" }, { status: 502 })),
		);
		renderGenerator({ aiEnabled: true, applyToSiteEnabled: true });

		fireEvent.click(screen.getByTestId("ai-theme-button"));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			/Could not apply AI theme/i,
		);
		expect(
			document.documentElement.style.getPropertyValue("--background"),
		).toBe("");
		expect(screen.getByTestId("apply-to-site-toggle")).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	});

	it("discards a stale AI theme response after editing a role", async () => {
		let resolveFetch: (response: Response) => void = () => {};
		vi.stubGlobal(
			"fetch",
			vi.fn(
				() =>
					new Promise<Response>((resolve) => {
						resolveFetch = resolve;
					}),
			),
		);
		renderGenerator({ aiEnabled: true, applyToSiteEnabled: true });

		fireEvent.click(screen.getByTestId("ai-theme-button"));
		fireEvent.change(screen.getByLabelText("Primary hex"), {
			target: { value: "#2563eb" },
		});
		resolveFetch(
			Response.json({
				light: { "--background": "#111111", "--foreground": "#ffffff" },
				dark: {},
			}),
		);

		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(
			document.documentElement.style.getPropertyValue("--background"),
		).toBe("");
		expect(screen.getByTestId("apply-to-site-toggle")).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	});

	it("clears AI vars after a successful AI apply when editing a role", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					light: { "--background": "#111111", "--foreground": "#ffffff" },
					dark: {},
				}),
			),
		);
		renderGenerator({ aiEnabled: true });

		fireEvent.click(screen.getByTestId("ai-theme-button"));
		await waitFor(() => {
			expect(
				document.documentElement.style.getPropertyValue("--background"),
			).toBe("#111111");
		});

		fireEvent.change(screen.getByLabelText("Primary hex"), {
			target: { value: "#2563eb" },
		});

		await waitFor(() => {
			expect(
				document.documentElement.style.getPropertyValue("--background"),
			).not.toBe("#111111");
		});
		expect(
			document.documentElement.style.getPropertyValue("--primary-50"),
		).toMatch(/^#[0-9a-f]{6}$/);
	});

	it("applies dark-scheme AI vars when the site is in dark mode", async () => {
		globalThis.__setPreferredColorScheme("dark");
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					light: { "--background": "#ffffff", "--foreground": "#111111" },
					dark: { "--background": "#050505", "--foreground": "#ffffff" },
				}),
			),
		);
		renderGenerator({ aiEnabled: true });

		fireEvent.click(screen.getByTestId("ai-theme-button"));

		await waitFor(() => {
			expect(
				document.documentElement.style.getPropertyValue("--background"),
			).toBe("#050505");
		});
	});

	it("only shows Add Color in the sticky color footer", () => {
		renderGenerator();

		expect(screen.getByTestId("add-custom")).toHaveTextContent("Add Color");
		expect(screen.queryByTestId("add-secondary")).not.toBeInTheDocument();
		expect(screen.queryByTestId("add-tertiary")).not.toBeInTheDocument();
	});

	it("anchors the Add Color footer to the bottom of the color scroll pane", () => {
		renderGenerator();

		expect(screen.getByTestId("generator-section-panel-color")).toHaveClass(
			"min-h-full",
		);
		expect(screen.getByTestId("color-sticky-footer")).toHaveClass(
			"sticky",
			"bottom-0",
			"mt-auto",
		);
	});

	it("places Add Color at the right edge of the color footer", () => {
		renderGenerator();

		expect(screen.getByTestId("color-sticky-footer")).toHaveClass(
			"justify-end",
		);
	});

	it("uses compact spacing for the sidebar divider", () => {
		renderGenerator();
		expect(screen.getByTestId("generator-sidebar-divider")).toHaveClass(
			"md:my-3",
		);
	});

	it("splits the sidebar and editor into standalone workspace lanes", () => {
		renderGenerator();
		const workspace = screen.getByTestId("generator-workspace");
		const sidebar = screen.getByTestId("generator-sidebar-lane");
		const content = screen.getByTestId("workspace-content");

		expect(workspace).toHaveClass("gap-3");
		expect(workspace).not.toHaveClass("border", "bg-card", "rounded-md");
		expect(sidebar).toHaveClass("rounded-md", "border", "bg-card");
		expect(sidebar).not.toHaveClass("md:border-r", "border-b");
		expect(content).toHaveClass("rounded-md", "border", "bg-card");
	});

	it("opens the preview as an overlay covering the workspace", () => {
		renderGenerator();
		const workspace = screen.getByTestId("generator-workspace");
		expect(workspace).toHaveClass("relative");
		expect(screen.queryByTestId("preview-overlay")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Preview" }));
		const overlay = screen.getByTestId("preview-overlay");
		expect(workspace).toContainElement(overlay);
		expect(overlay).toHaveClass("absolute", "inset-0");

		fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
		expect(screen.queryByTestId("preview-overlay")).not.toBeInTheDocument();
	});

	it("keeps the workspace fixed while the content pane scrolls", () => {
		renderGenerator();
		expect(screen.getByTestId("workspace-content")).toHaveClass(
			"min-h-0",
			"overflow-hidden",
		);
		expect(screen.getByTestId("workspace-scroll-area")).toHaveClass(
			"min-h-0",
			"flex-1",
			"overflow-y-auto",
			"workspace-scroll-area",
		);
		expect(screen.getByTestId("workspace-scroll-area")).not.toHaveClass(
			"p-5",
			"md:p-6",
		);
	});

	it("does not reserve an empty right gutter in the workspace scroll area", () => {
		const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
		expect(css).not.toContain("scrollbar-gutter");
	});

	it("wraps swatches when the workspace content is below the wide threshold", () => {
		renderGenerator();
		expect(screen.getByTestId("swatch-grid")).toHaveClass("swatch-grid");
	});

	it("renders one 50–950 scale for the primary by default", () => {
		renderGenerator();
		expect(screen.getAllByTestId("swatch")).toHaveLength(11);
	});

	it("shows the primary base hex", () => {
		renderGenerator();
		expect(screen.getByText("#a543bc")).toBeInTheDocument();
	});

	it("resets colors and typography to the default generator state", () => {
		renderGenerator();
		fireEvent.change(screen.getByLabelText("Primary hex"), {
			target: { value: "#2563eb" },
		});
		fireEvent.click(screen.getByTestId("add-custom"));
		expect(screen.getAllByTestId("swatch")).toHaveLength(22);

		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));
		chooseFont(
			screen.getByTestId("font-picker-typography-sample-1"),
			"Poppins",
		);
		expect(screen.getByText("Poppins Black")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Reset" }));

		expect(screen.getAllByTestId("swatch")).toHaveLength(11);
		expect(screen.getByLabelText("Primary hex")).toHaveValue("#006d77");
		expect(screen.queryByLabelText("Secondary hex")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Typography")).not.toBeInTheDocument();
		expect(screen.queryByText("Poppins Black")).not.toBeInTheDocument();
	});

	it("adds and removes a secondary role", () => {
		renderGenerator();
		fireEvent.click(screen.getByTestId("add-custom"));
		expect(screen.getAllByTestId("swatch")).toHaveLength(22);

		fireEvent.click(screen.getByRole("button", { name: /remove secondary/i }));
		expect(screen.getAllByTestId("swatch")).toHaveLength(11);
	});

	it("asks for confirmation before applying imported colors", async () => {
		renderGenerator();
		// The import entries live in a Radix menu, which opens on pointer events.
		await userEvent.click(screen.getByTestId("import-menu"));
		await userEvent.click(screen.getByTestId("import-palette"));
		fireEvent.change(
			screen.getByLabelText("Coolors URL, hex list, or uicolors.app JSON"),
			{
				target: { value: "https://coolors.co/264653-2a9d8f" },
			},
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Import 2 colors", hidden: true }),
		);

		const warning = screen
			.getByText(/save your current palette before importing/i)
			.closest('[role="alert"]');
		expect(warning).not.toBeNull();
		const warningAlert = warning as HTMLElement;
		const importLabel = screen.getByText(
			"Coolors URL, hex list, or uicolors.app JSON",
		);
		expect(warningAlert).toHaveClass(
			"border-destructive/30",
			"bg-destructive/10",
		);
		expect(warningAlert).toHaveTextContent(
			/Importing will overwrite your existing colors/i,
		);
		expect(
			warningAlert.compareDocumentPosition(importLabel) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(screen.getAllByTestId("swatch")).toHaveLength(11);

		fireEvent.click(
			screen.getByRole("button", { name: "Import colors", hidden: true }),
		);

		expect(screen.getAllByTestId("swatch")).toHaveLength(22);
		expect(screen.getByLabelText("Primary hex")).toHaveValue("#264653");
		expect(screen.getByLabelText("Secondary hex")).toHaveValue("#2a9d8f");
		expect(screen.queryByText("#a543bc")).not.toBeInTheDocument();
		expect(screen.getAllByText("#264653").length).toBeGreaterThan(0);
	});

	it("removes the primary and promotes the next role", () => {
		renderGenerator();
		fireEvent.click(screen.getByTestId("add-custom"));
		fireEvent.click(screen.getByRole("button", { name: /remove primary/i }));

		expect(screen.getAllByTestId("swatch")).toHaveLength(11);
		expect(screen.queryByLabelText("Primary hex")).not.toBeInTheDocument();
		expect(screen.getByLabelText("Secondary hex")).toBeInTheDocument();
	});

	it("cannot remove the last remaining role", () => {
		renderGenerator();
		expect(
			screen.queryByRole("button", { name: /remove primary/i }),
		).not.toBeInTheDocument();
	});

	it("copies a shade hex on click", async () => {
		renderGenerator();
		fireEvent.click(screen.getAllByTestId("swatch")[0]);
		await waitFor(() => {
			expect(writeText).toHaveBeenCalledTimes(1);
		});
		expect(writeText.mock.calls[0][0]).toMatch(/^#[0-9a-f]{6}$/);
	});

	it("regenerates when the primary hex changes", () => {
		renderGenerator();
		fireEvent.change(screen.getByLabelText("Primary hex"), {
			target: { value: "#2563eb" },
		});
		expect(screen.getByText("#2563eb")).toBeInTheDocument();
	});

	it("adds all three status scales from the Status tab empty state", () => {
		renderGenerator();
		selectGeneratorTab("Status");
		fireEvent.click(screen.getByTestId("add-status"));

		// Success + Warning + Error scales.
		expect(screen.getAllByTestId("swatch")).toHaveLength(33);
		expect(screen.getByDisplayValue("Success")).toBeInTheDocument();
	});

	it("re-adds a removed status scale with the aggregate footer button", () => {
		renderGenerator();
		selectGeneratorTab("Status");
		fireEvent.click(screen.getByTestId("add-status"));
		fireEvent.click(screen.getByRole("button", { name: /remove success/i }));
		expect(screen.getAllByTestId("swatch")).toHaveLength(22);
		expect(screen.queryByTestId("add-success")).not.toBeInTheDocument();
		expect(screen.queryByTestId("add-warning")).not.toBeInTheDocument();
		expect(screen.queryByTestId("add-error")).not.toBeInTheDocument();

		fireEvent.click(screen.getByTestId("add-status"));
		expect(screen.getAllByTestId("swatch")).toHaveLength(33);
		expect(screen.getByDisplayValue("Success")).toBeInTheDocument();
	});

	it("allows adding more neutral scales", () => {
		renderGenerator();
		selectGeneratorTab("Neutral");
		fireEvent.click(screen.getByTestId("add-neutral"));
		expect(screen.getAllByTestId("swatch")).toHaveLength(11);

		fireEvent.click(screen.getByTestId("add-neutral"));
		expect(screen.getAllByTestId("swatch")).toHaveLength(22);
	});

	it("uses sticky right-aligned footers for Neutral and Status actions", () => {
		renderGenerator();

		selectGeneratorTab("Neutral");
		expect(screen.getByTestId("neutral-sticky-footer")).toHaveClass(
			"sticky",
			"bottom-0",
			"mt-auto",
			"justify-end",
		);

		selectGeneratorTab("Status");
		expect(screen.getByTestId("status-sticky-footer")).toHaveClass(
			"sticky",
			"bottom-0",
			"mt-auto",
			"justify-end",
		);
	});

	it("puts the Add Fonts action in a sticky footer, not the empty-state card", () => {
		renderGenerator();
		selectGeneratorTab("Font");

		// The info card keeps only the copy; the action lives in the footer.
		const card = screen
			.getByText("Pick a font pairing and type scale for your theme.")
			.closest("div.border-dashed");
		expect(card).not.toBeNull();
		expect(
			within(card as HTMLElement).queryByRole("button"),
		).not.toBeInTheDocument();

		const footer = screen.getByTestId("font-sticky-footer");
		expect(footer).toHaveClass("sticky", "bottom-0");
		fireEvent.click(within(footer).getByRole("button", { name: "Add Fonts" }));

		// Once fonts are added, the typography panel brings its own footer.
		expect(screen.getByLabelText("Typography")).toBeInTheDocument();
		expect(screen.queryByTestId("font-sticky-footer")).not.toBeInTheDocument();
	});

	it("keeps typography hidden until Fonts is added, then removable", () => {
		renderGenerator();
		expect(screen.queryByLabelText("Typography")).not.toBeInTheDocument();

		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));
		expect(screen.getByLabelText("Typography")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("remove-typography"));
		expect(screen.queryByLabelText("Typography")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /add fonts/i }),
		).toBeInTheDocument();
	});

	it("shows a live typography sample when selecting font families", () => {
		renderGenerator();
		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));

		chooseFont(
			screen.getByTestId("font-picker-typography-sample-1"),
			"Poppins",
		);

		expect(screen.getByTestId("typography-sample")).toBeInTheDocument();
		expect(screen.getByTestId("typography-sample-heading")).toHaveStyle({
			fontFamily: "'Poppins', sans-serif",
		});
	});

	it("shows a weight and italic specimen for the selected heading family", () => {
		renderGenerator();
		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));

		chooseFont(
			screen.getByTestId("font-picker-typography-sample-1"),
			"Montserrat",
		);

		expect(screen.getByTestId("typography-specimen-family")).toHaveTextContent(
			"Montserrat",
		);
		expect(screen.getByText("Montserrat Black")).toHaveStyle({
			fontWeight: "900",
			fontStyle: "normal",
		});
		expect(screen.getByText("Montserrat Black Italic")).toHaveStyle({
			fontWeight: "900",
			fontStyle: "italic",
		});
		expect(screen.getByText("Montserrat Thin Italic")).toHaveStyle({
			fontWeight: "100",
			fontStyle: "italic",
		});
	});

	it("does not render the removed bottom font-family controls", () => {
		renderGenerator();
		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));

		expect(
			screen.queryByTestId("font-family-controls"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("font-picker-family-1"),
		).not.toBeInTheDocument();
		expect(screen.queryByText("Family 1")).not.toBeInTheDocument();
	});

	it("adds another full typography sample to the preview", () => {
		renderGenerator();
		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));

		expect(screen.getAllByTestId("typography-sample")).toHaveLength(1);
		expect(screen.getAllByText("Inter Black")).toHaveLength(1);
		fireEvent.click(screen.getByTestId("add-typography"));
		expect(screen.getAllByTestId("typography-sample")).toHaveLength(2);
		expect(screen.getAllByText("Inter Black")).toHaveLength(2);
		expect(screen.getAllByText("Inter Thin Italic")).toHaveLength(2);
		expect(screen.queryByText("Inter 4xl")).not.toBeInTheDocument();
	});

	it("does not show font selection in the sticky typography footer", () => {
		renderGenerator();
		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));

		const footer = screen.getByTestId("typography-sticky-footer");
		expect(
			within(footer).queryByTestId("font-picker-typography"),
		).not.toBeInTheDocument();
	});

	it("adds new typography samples from the current heading sample family", () => {
		renderGenerator();
		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));

		chooseFont(
			screen.getByTestId("font-picker-typography-sample-1"),
			"Montserrat",
		);
		fireEvent.click(screen.getByTestId("add-typography"));

		const samples = screen.getAllByTestId("typography-sample");
		expect(samples).toHaveLength(2);
		expect(
			within(samples[0]).getByText("Montserrat Black"),
		).toBeInTheDocument();
		expect(
			within(samples[1]).getByText("Montserrat Black"),
		).toBeInTheDocument();
	});

	it("keeps typography sample dropdowns scoped to their own sample", () => {
		renderGenerator();
		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));

		chooseFont(
			screen.getByTestId("font-picker-typography-sample-1"),
			"Montserrat",
		);

		fireEvent.click(screen.getByTestId("add-typography"));

		chooseFont(screen.getByTestId("font-picker-typography-sample-2"), "Lora");

		const samples = screen.getAllByTestId("typography-sample");
		expect(samples).toHaveLength(2);
		expect(
			within(samples[0]).getByText("Montserrat Black"),
		).toBeInTheDocument();
		expect(within(samples[1]).getByText("Lora Black")).toBeInTheDocument();
		expect(
			within(samples[0]).queryByText("Lora Black"),
		).not.toBeInTheDocument();
	});

	it("shows added typography samples in the Preview overlay", () => {
		renderGenerator();
		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));

		fireEvent.click(screen.getByTestId("add-typography"));
		chooseFont(screen.getByTestId("font-picker-typography-sample-2"), "Lora");
		fireEvent.click(screen.getByRole("button", { name: "Preview" }));

		const preview = screen.getByTestId("preview-overlay");
		const extraLabel = within(preview).getByText("Extra · Lora");
		const extraRow = extraLabel.closest("div");
		expect(extraRow).not.toBeNull();
		expect(
			within(extraRow as HTMLElement).getByText("The quick brown fox"),
		).toHaveStyle({
			fontFamily: "'Lora', serif",
		});
	});

	it("uses a sticky typography footer for size controls and add action", () => {
		renderGenerator();
		selectGeneratorTab("Font");
		fireEvent.click(screen.getByRole("button", { name: /add fonts/i }));

		expect(screen.getByTestId("generator-section-panel-font")).toHaveClass(
			"min-h-full",
		);
		expect(screen.getByTestId("generator-section-panel-font")).not.toHaveClass(
			"p-5",
			"md:p-6",
		);
		const footer = screen.getByTestId("typography-sticky-footer");
		expect(footer).toHaveClass(
			"sticky",
			"bottom-0",
			"mt-auto",
			"justify-between",
			"md:px-6",
		);
		expect(within(footer).getByLabelText("Base font size in pixels")).toBe(
			screen.getByLabelText("Base font size in pixels"),
		);
		expect(within(footer).getByLabelText("Modular scale ratio")).toBe(
			screen.getByLabelText("Modular scale ratio"),
		);
		expect(within(footer).getByTestId("add-typography")).toHaveTextContent(
			"Add Typography",
		);
	});

	it("names colors by position and shows them as pills", () => {
		renderGenerator();
		fireEvent.click(screen.getByTestId("add-custom"));
		fireEvent.click(screen.getByTestId("add-custom"));

		const pills = screen.getAllByTestId("color-pill");
		expect(pills.map((pill) => pill.textContent)).toEqual([
			"Primary",
			"Secondary",
			"Tertiary",
		]);
	});

	it("reorders colors by dragging a pill to the front", () => {
		renderGenerator();
		fireEvent.click(screen.getByTestId("add-custom"));
		fireEvent.change(screen.getByLabelText("Secondary hex"), {
			target: { value: "#123456" },
		});

		const pills = screen.getAllByTestId("color-pill");
		fireEvent.dragStart(pills[1]);
		fireEvent.drop(pills[0]);

		// The dragged color is now the primary; default names follow position.
		expect(screen.getByLabelText("Primary hex")).toHaveValue("#123456");
		expect(screen.getByLabelText("Secondary hex")).toHaveValue("#a543bc");
	});

	it("reorders color cards by dragging the card handle", () => {
		renderGenerator();
		fireEvent.click(screen.getByTestId("add-custom"));
		fireEvent.change(screen.getByLabelText("Secondary hex"), {
			target: { value: "#123456" },
		});

		const handles = screen.getAllByTestId("color-card-drag-handle");
		fireEvent.dragStart(handles[1]);
		fireEvent.drop(handles[0]);

		expect(screen.getByLabelText("Primary hex")).toHaveValue("#123456");
		expect(screen.getByLabelText("Secondary hex")).toHaveValue("#a543bc");
	});

	it("shows positional role pills below each color card title after reordering", () => {
		renderGenerator();
		fireEvent.click(screen.getByTestId("add-custom"));
		fireEvent.click(screen.getByTestId("add-custom"));
		fireEvent.change(screen.getByLabelText("Tertiary name"), {
			target: { value: "Accent" },
		});

		const handles = screen.getAllByTestId("color-card-drag-handle");
		fireEvent.dragStart(handles[2]);
		fireEvent.drop(handles[0]);

		expect(
			screen
				.getAllByTestId("color-card-role-pill")
				.map((pill) => pill.textContent),
		).toEqual(["Primary", "Secondary", "Tertiary"]);
		expect(
			screen.getAllByTestId("color-card-role-pill")[0].previousSibling,
		).toBe(screen.getByDisplayValue("Accent"));
		expect(screen.getByDisplayValue("Accent")).toBeInTheDocument();
	});

	it("keeps user-typed names when reordering", () => {
		renderGenerator();
		fireEvent.click(screen.getByTestId("add-custom"));
		fireEvent.change(screen.getByLabelText("Secondary name"), {
			target: { value: "Brand" },
		});

		const pills = screen.getAllByTestId("color-pill");
		fireEvent.dragStart(pills[1]);
		fireEvent.drop(pills[0]);

		expect(screen.getAllByTestId("color-pill")[0]).toHaveTextContent("Brand");
	});

	it("shows the generator sidebar sections", () => {
		renderGenerator();
		expect(screen.getByRole("tab", { name: "Color" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Neutral" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Status" })).toBeInTheDocument();
		expect(screen.getByRole("tab", { name: "Font" })).toBeInTheDocument();
	});

	it("gives every generator section a stable identifier", () => {
		renderGenerator();

		const sections = [
			{ id: "color", label: "Color" },
			{ id: "neutral", label: "Neutral" },
			{ id: "status", label: "Status" },
			{ id: "font", label: "Font" },
		];

		for (const section of sections) {
			expect(
				screen.getByTestId(`generator-section-tab-${section.id}`),
			).toHaveAttribute("id", `generator-section-tab-${section.id}`);
		}

		for (const section of sections) {
			selectGeneratorTab(section.label);
			expect(
				screen.getByTestId(`generator-section-panel-${section.id}`),
			).toHaveAttribute("id", `generator-section-panel-${section.id}`);
		}
	});

	it("shows typography when the URL carries non-default type settings", () => {
		render(
			<PaletteGenerator
				initialTheme={defaultTheme("#a543bc")}
				initialTypography={{ ...defaultTypography(), baseSize: 18 }}
			/>,
		);
		selectGeneratorTab("Font");
		expect(screen.getByLabelText("Typography")).toBeInTheDocument();
	});
});
