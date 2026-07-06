import type { JSX } from "react";
import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { privacyDocument } from "@/lib/legal-content";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
	title: privacyDocument.title,
	description: privacyDocument.description,
	alternates: {
		canonical: "/privacy",
	},
	openGraph: {
		title: `${privacyDocument.title} - ${siteConfig.name}`,
		description: privacyDocument.description,
		url: `${siteConfig.url}/privacy`,
	},
};

export default function PrivacyPage(): JSX.Element {
	return (
		<main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto px-5 py-8">
			<LegalDocument document={privacyDocument} />
		</main>
	);
}
