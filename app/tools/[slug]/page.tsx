import type { Metadata } from "next";
import type { JSX } from "react";
import { notFound } from "next/navigation";

import { GrowthCta } from "@/components/growth/growth-cta";
import { GROWTH_PAGES, getGrowthPage } from "@/lib/growth-pages";
import { siteConfig } from "@/lib/site-config";

type GrowthPageProps = {
	params: Promise<{ slug: string }>;
};

export function generateStaticParams(): Array<{ slug: string }> {
	return GROWTH_PAGES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
	params,
}: GrowthPageProps): Promise<Metadata> {
	const page = getGrowthPage((await params).slug);
	if (!page) return { title: "Tool not found", robots: { index: false } };
	const canonicalPath = `/tools/${page.slug}`;
	return {
		title: page.title,
		description: page.description,
		alternates: { canonical: canonicalPath },
		openGraph: {
			type: "website",
			locale: siteConfig.locale,
			url: canonicalPath,
			siteName: siteConfig.name,
			title: page.title,
			description: page.description,
		},
		twitter: {
			card: "summary_large_image",
			title: page.title,
			description: page.description,
			creator: siteConfig.twitterHandle,
		},
	};
}

export default async function GrowthLandingPage({
	params,
}: GrowthPageProps): Promise<JSX.Element> {
	const page = getGrowthPage((await params).slug);
	if (!page) notFound();

	return (
		<main className="mx-auto w-full max-w-5xl px-5 py-12 sm:py-16">
			<section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
				<div>
					<p className="text-primary mb-3 text-sm font-semibold tracking-wide uppercase">
						{page.eyebrow}
					</p>
					<h1 className="text-foreground max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
						{page.headline}
					</h1>
					<p className="text-muted-foreground mt-5 max-w-2xl text-lg leading-8">
						{page.intro}
					</p>
					<ul className="text-foreground my-7 grid gap-3">
						{page.benefits.map((benefit) => (
							<li key={benefit} className="flex gap-3">
								<span aria-hidden="true" className="text-primary">
									✓
								</span>
								{benefit}
							</li>
						))}
					</ul>
					<GrowthCta
						href={page.ctaHref}
						label={page.ctaLabel}
						landing={page.slug}
					/>
				</div>

				<div className="border-border bg-card rounded-xl border p-5 shadow-sm">
					<h3 className="text-foreground mb-3 font-semibold">
						{page.exampleTitle}
					</h3>
					<pre className="bg-foreground text-background overflow-x-auto rounded-lg p-4 text-sm leading-6">
						<code>{page.example}</code>
					</pre>
				</div>
			</section>

			<section className="mt-16">
				<h2 className="text-foreground text-2xl font-semibold">
					Frequently asked questions
				</h2>
				<div className="mt-6 grid gap-4 md:grid-cols-2">
					{page.faq.map(({ question, answer }) => (
						<article
							key={question}
							className="border-border bg-card rounded-xl border p-5"
						>
							<h3 className="text-foreground font-semibold">{question}</h3>
							<p className="text-muted-foreground mt-2 leading-7">{answer}</p>
						</article>
					))}
				</div>
			</section>
		</main>
	);
}
