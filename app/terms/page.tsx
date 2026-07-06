import type { JSX } from "react";
import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { siteConfig } from "@/lib/site-config";
import { termsDocument } from "@/lib/legal-content";

export const metadata: Metadata = {
	title: termsDocument.title,
	description: termsDocument.description,
	alternates: {
		canonical: "/terms",
	},
	openGraph: {
		title: `${termsDocument.title} - ${siteConfig.name}`,
		description: termsDocument.description,
		url: `${siteConfig.url}/terms`,
	},
};

export default function TermsPage(): JSX.Element {
	return (
		<main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto px-5 py-8">
			<LegalDocument document={termsDocument} />
		</main>
	);
}
