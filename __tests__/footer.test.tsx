import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/lib/site-config";

describe("Footer", () => {
	it("renders legal links and the rights notice", () => {
		render(<Footer />);

		expect(screen.getByRole("contentinfo")).toHaveTextContent(
			new RegExp(
				`Copyright \\d{4} ${siteConfig.name}\\. All rights reserved\\.`,
			),
		);
		expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
			"href",
			"/terms",
		);
		expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
			"href",
			"/privacy",
		);
	});
});
