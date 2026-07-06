import type { JSX } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LegalDocument as LegalDocumentContent } from "@/lib/legal-content";

type LegalDocumentProps = {
	document: LegalDocumentContent;
};

export function LegalDocument({ document }: LegalDocumentProps): JSX.Element {
	return (
		<article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
			<header className="border-border flex flex-col gap-3 border-b pb-6">
				<Button asChild variant="outline" size="sm" className="w-fit">
					<Link href="/">
						<ArrowLeft />
						Back
					</Link>
				</Button>
				<p className="text-muted-foreground text-sm font-medium">
					Last updated {document.lastUpdated}
				</p>
				<h1 className="text-foreground text-4xl font-semibold tracking-normal">
					{document.title}
				</h1>
				<div className="text-muted-foreground flex flex-col gap-3 text-base leading-7">
					{document.intro.map((paragraph) => (
						<p key={paragraph}>{paragraph}</p>
					))}
				</div>
			</header>
			<div className="flex flex-col gap-7">
				{document.sections.map((section) => (
					<section key={section.title} className="flex flex-col gap-3">
						<h2 className="text-foreground text-2xl font-semibold tracking-normal">
							{section.title}
						</h2>
						{section.body.map((paragraph) => (
							<p
								key={paragraph}
								className="text-muted-foreground text-base leading-7"
							>
								{paragraph}
							</p>
						))}
						{section.items ? (
							<ul className="text-muted-foreground list-disc space-y-2 pl-6 text-base leading-7">
								{section.items.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						) : null}
					</section>
				))}
			</div>
		</article>
	);
}
