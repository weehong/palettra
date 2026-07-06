import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { FontPicker } from "@/components/generator/font-picker";

describe("FontPicker", () => {
	it("shows the current value and selects a new font", () => {
		const onChange = vi.fn();
		render(<FontPicker value="Inter" label="Sans" onChange={onChange} />);

		// Current value is shown in the summary.
		const summary = screen.getByTestId("font-picker-sans");
		expect(summary).toHaveTextContent("Inter");

		// Options render in the popover; pick one.
		fireEvent.click(summary);
		fireEvent.click(screen.getByRole("option", { name: /Poppins/ }));
		expect(onChange).toHaveBeenCalledWith("Poppins");
	});

	it("marks the active option as selected", () => {
		render(<FontPicker value="Lora" label="Serif" onChange={() => {}} />);
		fireEvent.click(screen.getByTestId("font-picker-serif"));
		const active = screen.getByRole("option", { name: /Lora/ });
		expect(active).toHaveAttribute("aria-selected", "true");
		expect(within(active).getByText("✓")).toBeInTheDocument();
	});

	it("filters the options as you search", () => {
		render(<FontPicker value="Inter" label="Heading" onChange={() => {}} />);
		fireEvent.click(screen.getByTestId("font-picker-heading"));
		const search = screen.getByLabelText("Search heading fonts");
		fireEvent.change(search, { target: { value: "manro" } });
		expect(screen.getByRole("option", { name: /Manrope/ })).toBeInTheDocument();
		expect(
			screen.queryByRole("option", { name: /Poppins/ }),
		).not.toBeInTheDocument();

		fireEvent.change(search, { target: { value: "zzzz" } });
		expect(screen.getByText("No fonts match.")).toBeInTheDocument();
	});
});
