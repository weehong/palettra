export type LegalSection = {
	title: string;
	body: ReadonlyArray<string>;
	items?: ReadonlyArray<string>;
};

export type LegalDocument = {
	title: string;
	description: string;
	lastUpdated: string;
	intro: ReadonlyArray<string>;
	sections: ReadonlyArray<LegalSection>;
};

const supportEmail = "vernonweehongkoh.developer@outlook.com";

export const termsDocument: LegalDocument = {
	title: "Terms and Conditions",
	description:
		"Terms for using Palettra, including accounts, saved palettes, exports, acceptable use, and third-party services.",
	lastUpdated: "July 5, 2026",
	intro: [
		"These Terms and Conditions govern your access to and use of Palettra. By using Palettra, you agree to these Terms. If you do not agree, do not use the service.",
		"These Terms are a working draft for the site owner to review before launch and are not legal advice.",
	],
	sections: [
		{
			title: "The service",
			body: [
				"Palettra is a web tool for creating Tailwind-ready color systems, typography choices, UI previews, WCAG contrast checks, shareable palette URLs, and token exports for tools such as Tailwind, CSS variables, and Figma.",
				"We may change, suspend, or discontinue any part of Palettra at any time, including previews, imports, exports, saved palettes, account features, analytics, and experimental AI-assisted features.",
			],
		},
		{
			title: "Accounts and sign-in",
			body: [
				"Some features, including saved palettes, require you to sign in through a supported third-party identity provider such as Google, Facebook, or X/Twitter through Firebase Authentication.",
				"You are responsible for the activity that occurs through your account and for keeping your identity-provider account secure. You must use Palettra only if you are legally able to enter into these Terms.",
			],
		},
		{
			title: "Saved palettes and user content",
			body: [
				"You may create, import, name, save, rename, open, export, and delete palettes. Saved palettes may include color roles, generated color values, typography choices, palette names, generated URLs, and timestamps.",
				"You keep any rights you have in content you provide to Palettra. You grant Palettra a limited license to host, store, process, display, transmit, and otherwise use that content only as needed to operate, secure, improve, and provide the service.",
				"Do not submit confidential, regulated, or sensitive personal information through palette names, imported content, URLs, or experimental AI features.",
			],
		},
		{
			title: "Exports and design output",
			body: [
				"Palettra can generate palettes, code snippets, and design-token exports. You are responsible for reviewing the output before using it in production, including accessibility, browser support, brand suitability, licensing, and integration with your own codebase.",
				"Palettra does not guarantee that generated colors, typography, previews, imports, exports, or contrast assessments will be error-free or fit your particular purpose.",
			],
		},
		{
			title: "Acceptable use",
			body: ["You agree that you will not:"],
			items: [
				"use Palettra in a way that violates applicable law or third-party rights;",
				"attempt to access another user's saved palettes or account;",
				"interfere with, overload, scan, scrape, or disrupt Palettra or its infrastructure;",
				"submit malicious code, harmful content, illegal content, or content you do not have the right to use;",
				"circumvent rate limits, security controls, authentication, or access restrictions;",
				"misrepresent your relationship with Palettra or use Palettra to deceive others.",
			],
		},
		{
			title: "Third-party services",
			body: [
				"Palettra may rely on third-party services for hosting, authentication, database storage, analytics, fonts, identity-provider sign-in, and optional AI-assisted theme generation. These services may process data under their own terms and privacy policies.",
				"Third-party services are not controlled by Palettra. Palettra is not responsible for third-party services, websites, policies, availability, or content.",
			],
		},
		{
			title: "AI-assisted and experimental features",
			body: [
				"If AI-assisted features are enabled, palette role names, color values, and related theme data may be sent to an external AI provider to produce site-theme suggestions. Do not provide personal, confidential, proprietary, or sensitive information in those inputs.",
				"AI-assisted output may be inaccurate, incomplete, or unsuitable. You are responsible for reviewing and deciding whether to use any generated output.",
			],
		},
		{
			title: "Account deletion",
			body: [
				"You may delete your account from the settings page when account features are enabled. Palettra will attempt to delete your saved palette data before deleting your Firebase Authentication account.",
				"Some deletion requests may require reauthentication with your identity provider. If deletion partly fails, some data may remain until the request is retried or handled manually.",
			],
		},
		{
			title: "Intellectual property",
			body: [
				"Palettra, including its name, interface, code, branding, and site content, is owned by Palettra or its licensors and is protected by applicable intellectual-property laws.",
				"Subject to these Terms, you may use generated palette exports in your own personal or commercial projects. This permission does not transfer ownership of Palettra itself or any third-party materials.",
			],
		},
		{
			title: "Disclaimers",
			body: [
				"Palettra is provided on an as-is and as-available basis. To the maximum extent permitted by law, Palettra disclaims all warranties, whether express, implied, statutory, or otherwise, including warranties of merchantability, fitness for a particular purpose, non-infringement, availability, accuracy, and security.",
			],
		},
		{
			title: "Limitation of liability",
			body: [
				"To the maximum extent permitted by law, Palettra and its owners, operators, affiliates, and service providers will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, goodwill, data, or business opportunities arising from or related to your use of the service.",
			],
		},
		{
			title: "Termination",
			body: [
				"We may suspend or terminate your access to Palettra if we believe you have violated these Terms, created risk for the service or other users, or used the service unlawfully or abusively.",
			],
		},
		{
			title: "Governing law",
			body: [
				"These Terms are governed by applicable law, without regard to conflict-of-law rules. Unless applicable law requires otherwise, disputes will be handled in courts with competent jurisdiction over Palettra or the dispute.",
			],
		},
		{
			title: "Changes to these Terms",
			body: [
				"We may update these Terms from time to time. When changes are material, we will take reasonable steps to provide notice. The updated Terms will apply from the stated effective date or, if no effective date is stated, when posted.",
			],
		},
		{
			title: "Contact",
			body: [`Questions about these Terms can be sent to ${supportEmail}.`],
		},
	],
};

export const privacyDocument: LegalDocument = {
	title: "Privacy Policy",
	description:
		"Privacy Policy for Palettra, covering account data, saved palettes, analytics, third-party providers, retention, and deletion.",
	lastUpdated: "July 5, 2026",
	intro: [
		"This Privacy Policy explains how Palettra collects, uses, shares, and protects information when you use the service.",
		"This Privacy Policy is a working draft for the site owner to review before launch and is not legal advice.",
	],
	sections: [
		{
			title: "Information we collect",
			body: [
				"Palettra can be used without signing in for core palette generation, previews, imports, exports, and shareable URL generation. Some information is still processed by your browser and by service infrastructure when you load or use the site.",
				"When you sign in, Firebase Authentication and your chosen identity provider may provide account information such as your user ID, display name, email address, profile photo URL, provider ID, authentication tokens, and sign-in metadata.",
				"When you save palettes, Palettra stores palette names, color roles, color values, typography choices, generated palette URLs, and created/updated timestamps in Cloud Firestore under your user account.",
				"When analytics are enabled, Palettra may send usage events and web-vital metrics to Google Analytics, such as sign-in events, palette saves, imports, exports, preview opens, route/render metrics, and similar interaction data.",
				"When optional AI-assisted theme generation is enabled, Palettra may send palette role names, role slugs, preset labels, generated ramp variables, selected model names, and related theme data to an external AI provider to generate theme suggestions.",
			],
		},
		{
			title: "Information you should not provide",
			body: [
				"Do not enter sensitive personal information, secrets, credentials, regulated data, confidential business information, or information you do not have the right to use in palette names, imported palette data, URLs, exports, or AI-assisted inputs.",
			],
		},
		{
			title: "How we use information",
			body: ["Palettra uses information to:"],
			items: [
				"provide palette generation, preview, import, export, sharing, and saved-palette features;",
				"authenticate users and maintain account sessions;",
				"store, list, rename, open, and delete saved palettes;",
				"operate, secure, debug, measure, and improve the service;",
				"understand feature usage and performance through analytics, when analytics are configured;",
				"generate optional AI-assisted site-theme suggestions, when those features are enabled;",
				"comply with legal obligations and enforce the Terms and Conditions.",
			],
		},
		{
			title: "Cookies and similar technologies",
			body: [
				"Palettra and its providers may use cookies, local storage, identifiers, and similar technologies for authentication, security, analytics, preferences, performance measurement, and service operation.",
				"Google Analytics may use cookies or similar technologies to collect and process analytics data when a Google Analytics measurement ID is configured.",
			],
		},
		{
			title: "How we share information",
			body: [
				"Palettra does not sell saved palettes or account information. Palettra may share information with service providers that help operate the service, including hosting providers, Firebase/Google Cloud services, Google Analytics, identity providers, font providers, and optional AI providers.",
				"We may also disclose information if required by law, legal process, security needs, fraud prevention, protection of rights, or enforcement of the Terms and Conditions.",
			],
		},
		{
			title: "Third-party providers",
			body: [
				"Firebase Authentication is used for sign-in, and Cloud Firestore is used for saved palette storage when Firebase is configured. Google Analytics is used only when a Google Analytics measurement ID is configured.",
				"Sign-in providers such as Google, Facebook, and X/Twitter process information according to their own terms and privacy policies. Optional AI providers, if enabled, process submitted theme data according to their own terms and privacy policies.",
			],
		},
		{
			title: "Retention and deletion",
			body: [
				"Saved palettes remain stored until you delete them, delete your account, or until Palettra removes them under these Terms or applicable law.",
				"You can delete your account from the settings page when account features are enabled. Account deletion attempts to delete saved palette data first and then delete the Firebase Authentication account. Some provider, backup, log, analytics, or legal-retention copies may persist for a limited period according to the relevant provider's policies or legal obligations.",
			],
		},
		{
			title: "Security",
			body: [
				"Palettra uses Firebase client authentication, owner-scoped Firestore paths, and application-level validation to help protect saved palette data. No internet service can guarantee complete security.",
				"You are responsible for protecting access to your sign-in provider account and for signing out on shared devices.",
			],
		},
		{
			title: "International processing",
			body: [
				"Palettra and its providers may process and store information in countries other than your own. Those countries may have different data-protection laws from where you live.",
			],
		},
		{
			title: "Children",
			body: [
				"Palettra is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, contact us so we can review and delete it where appropriate.",
			],
		},
		{
			title: "Your choices",
			body: [
				"You may use the core generator without signing in. If you sign in, you may save, rename, open, and delete palettes, sign out, or delete your account from settings when account features are available.",
				"You may use browser settings, extensions, or provider tools to control cookies and analytics technologies. Blocking some technologies may affect service functionality.",
			],
		},
		{
			title: "Changes to this Privacy Policy",
			body: [
				"We may update this Privacy Policy from time to time. When changes are material, we will take reasonable steps to provide notice. The updated Privacy Policy will apply from the stated effective date or, if no effective date is stated, when posted.",
			],
		},
		{
			title: "Contact",
			body: [
				`Questions or requests about this Privacy Policy can be sent to ${supportEmail}.`,
			],
		},
	],
};
