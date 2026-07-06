import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { StitchSpec } from "@/lib/stitch";
import { StitchTokensPanel } from "@/components/generator/stitch-tokens-panel";

function makeSpec(): StitchSpec {
	return {
		colors: { primary: "#9f0026" },
		typography: {},
		rounded: {},
		spacing: {},
		frontmatterKeyOrder: ["colors"],
		extraFrontmatter: {},
		sections: [
			{
				heading: "Brand & Style",
				level: 2,
				body: "Bold intent here.\n\n- **Minimalism:** generous margins.\n- **Precision:** thin lines.",
			},
		],
		raw: "",
	};
}

describe("StitchTokensPanel brand notes", () => {
	it("renders section bodies as Markdown, not literal syntax", () => {
		render(<StitchTokensPanel spec={makeSpec()} />);

		// The bold marker becomes a <strong>, not literal asterisks.
		const strong = screen.getByText("Minimalism:");
		expect(strong.tagName).toBe("STRONG");
		expect(screen.queryByText(/\*\*Minimalism/)).toBeNull();

		// The dash list becomes real list items.
		expect(document.querySelectorAll("li")).toHaveLength(2);
	});
});
