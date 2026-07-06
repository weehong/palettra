import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { generatePalette } from "@/lib/color";
import { defaultTypography } from "@/lib/typography";
import { PreviewOverlay } from "@/components/generator/preview-overlay";

function renderOverlay(
	paletteNames: ReadonlyArray<string>,
	{
		open = true,
		onOpenChange = () => {},
	}: { open?: boolean; onOpenChange?: (open: boolean) => void } = {},
) {
	const palettes = paletteNames.map((name) =>
		generatePalette("#a543bc", name),
	);
	return render(
		<PreviewOverlay
			open={open}
			onOpenChange={onOpenChange}
			cssVars={{}}
			typography={defaultTypography()}
			palettes={palettes}
		/>,
	);
}

describe("PreviewOverlay", () => {
	it("renders nothing when closed", () => {
		renderOverlay(["Primary"], { open: false });
		expect(screen.queryByTestId("preview-overlay")).not.toBeInTheDocument();
	});

	it("covers its container as an absolute overlay, not a dialog", () => {
		renderOverlay(["Primary"]);
		const overlay = screen.getByTestId("preview-overlay");
		expect(overlay).toHaveClass("absolute", "inset-0");
		expect(overlay.tagName).not.toBe("DIALOG");
	});

	it("stacks above the z-10 sticky panel footers", () => {
		renderOverlay(["Primary"]);
		expect(screen.getByTestId("preview-overlay")).toHaveClass("z-20");
	});

	it("calls onOpenChange(false) when the close button is clicked", () => {
		const onOpenChange = vi.fn();
		renderOverlay(["Primary"], { onOpenChange });
		fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("calls onOpenChange(false) when Escape is pressed", () => {
		const onOpenChange = vi.fn();
		renderOverlay(["Primary"], { onOpenChange });
		fireEvent.keyDown(document, { key: "Escape" });
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("shows only the Design system tab, selected", () => {
		renderOverlay(["Primary"]);
		const tabs = screen.getAllByRole("tab");
		expect(tabs).toHaveLength(1);
		expect(tabs[0]).toHaveTextContent("Design system");
		expect(tabs[0]).toHaveAttribute("aria-selected", "true");
	});

	it("renders the Design system board, not the other templates", () => {
		renderOverlay(["Primary"]);
		expect(
			screen.getByRole("heading", { name: "Foundations" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("tab", { name: "Components" }),
		).not.toBeInTheDocument();
	});
});
