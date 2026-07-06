import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ImportPaletteDialog } from "@/components/generator/import-palette-dialog";

describe("ImportPaletteDialog", () => {
	it("replaces uploaded JSON text with a centered three-column color grid", async () => {
		const onImport = vi.fn();
		render(
			<ImportPaletteDialog
				open
				onOpenChange={vi.fn()}
				onImport={onImport}
				requiresConfirmation={false}
			/>,
		);
		const file = new File(
			[
				JSON.stringify({
					"red-ribbon": {
						"500": { value: "#e63946", type: "color" },
					},
					"powder-blue": {
						"500": { value: "#3e949c", type: "color" },
					},
					cello: {
						"500": { value: "#3777c0", type: "color" },
					},
				}),
			],
			"palette.json",
			{ type: "application/json" },
		);

		await userEvent.upload(screen.getByLabelText("Load JSON file"), file);

		const grid = await screen.findByTestId("uploaded-color-grid");
		expect(
			screen.queryByLabelText("Coolors URL, hex list, or uicolors.app JSON"),
		).not.toBeInTheDocument();
		expect(grid).toHaveClass("grid", "w-full", "grid-cols-3", "gap-3");
		const cards = screen.getAllByTestId("uploaded-color-card");
		expect(cards).toHaveLength(3);
		for (const card of cards) {
			expect(card).toHaveClass("items-center", "justify-center", "text-center");
		}
		expect(screen.getByText("Red Ribbon")).toBeInTheDocument();
		expect(screen.getByText("#e63946")).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Import 3 colors" }));

		await waitFor(() => {
			expect(onImport).toHaveBeenCalledWith([
				{ name: "Red Ribbon", hex: "#e63946" },
				{ name: "Powder Blue", hex: "#3e949c" },
				{ name: "Cello", hex: "#3777c0" },
			]);
		});
	});
});
