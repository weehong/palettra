import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PrivacyPage, { metadata as privacyMetadata } from "@/app/privacy/page";
import TermsPage, { metadata as termsMetadata } from "@/app/terms/page";
import { privacyDocument, termsDocument } from "@/lib/legal-content";

const supportEmail = "vernonweehongkoh.developer@outlook.com";

describe("legal pages", () => {
	it("renders the Terms and Conditions page content and metadata", () => {
		render(<TermsPage />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: termsDocument.title,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText(`Last updated ${termsDocument.lastUpdated}`),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
			"href",
			"/",
		);
		expect(screen.getByText(new RegExp(supportEmail))).toBeInTheDocument();
		expect(termsMetadata.title).toBe(termsDocument.title);
		expect(termsMetadata.description).toBe(termsDocument.description);
	});

	it("renders the Privacy Policy page content and metadata", () => {
		render(<PrivacyPage />);

		expect(
			screen.getByRole("heading", {
				level: 1,
				name: privacyDocument.title,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText(`Last updated ${privacyDocument.lastUpdated}`),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
			"href",
			"/",
		);
		expect(screen.getByText(new RegExp(supportEmail))).toBeInTheDocument();
		expect(privacyMetadata.title).toBe(privacyDocument.title);
		expect(privacyMetadata.description).toBe(privacyDocument.description);
	});
});
