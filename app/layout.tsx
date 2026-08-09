import type { Metadata, Viewport } from "next";
import type { JSX, ReactNode } from "react";
import { Google_Sans, Google_Sans_Code } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { isFeedbackConfigured } from "@/lib/feedback";
import { siteConfig, isIndexable } from "@/lib/site-config";
import {
	getOrganizationStructuredData,
	getWebApplicationStructuredData,
	getWebSiteStructuredData,
} from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Providers } from "@/app/providers";
import { WebVitals } from "@/components/analytics/web-vitals";

import "./globals.css";

// These fonts are not in Next's built-in font-metrics database, so its automatic
// (CLS-reducing) fallback can't be generated and it warns. Disable that and supply
// an explicit fallback stack instead.
const googleSans = Google_Sans({
	variable: "--font-google-sans",
	subsets: ["latin"],
	adjustFontFallback: false,
	fallback: ["system-ui", "arial", "sans-serif"],
});

const googleSansCode = Google_Sans_Code({
	variable: "--font-google-sans-code",
	subsets: ["latin"],
	adjustFontFallback: false,
	fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		default: siteConfig.title,
		template: `%s — ${siteConfig.name}`,
	},
	description: siteConfig.description,
	applicationName: siteConfig.name,
	authors: [{ name: siteConfig.author }],
	creator: siteConfig.author,
	publisher: siteConfig.author,
	keywords: siteConfig.keywords,
	alternates: {
		canonical: "/",
	},
	openGraph: {
		type: "website",
		locale: siteConfig.locale,
		url: siteConfig.url,
		siteName: siteConfig.name,
		title: siteConfig.title,
		description: siteConfig.description,
	},
	twitter: {
		card: "summary_large_image",
		title: siteConfig.title,
		description: siteConfig.description,
		creator: siteConfig.twitterHandle,
	},
	robots: {
		index: isIndexable,
		follow: isIndexable,
		googleBot: {
			index: isIndexable,
			follow: isIndexable,
		},
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: [
		{
			media: "(prefers-color-scheme: light)",
			color: siteConfig.backgroundColor,
		},
		{ media: "(prefers-color-scheme: dark)", color: siteConfig.themeColor },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>): JSX.Element {
	return (
		<html
			lang="en"
			className={`${googleSans.variable} ${googleSansCode.variable} h-full antialiased`}
		>
			<body className="min-h-dvh">
				<JsonLd data={getWebSiteStructuredData()} />
				<JsonLd data={getWebApplicationStructuredData()} />
				<JsonLd data={getOrganizationStructuredData()} />
				<Providers>
					<div data-app-shell className="flex min-h-dvh flex-col">
						<div className="flex min-h-0 flex-1 flex-col">
							<WebVitals />
							<Navbar feedbackEnabled={isFeedbackConfigured(process.env)} />
							{children}
						</div>
						<Footer />
					</div>
				</Providers>
				<Analytics />
				<SpeedInsights />
			</body>
			{process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
				<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
			) : null}
		</html>
	);
}
