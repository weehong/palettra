"use client";

import Link from "next/link";
import type { JSX } from "react";

import { buttonVariants } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type GrowthCtaProps = {
	href: string;
	label: string;
	landing: string;
};

export function GrowthCta({
	href,
	label,
	landing,
}: GrowthCtaProps): JSX.Element {
	return (
		<Link
			href={href}
			className={cn(buttonVariants(), "px-6 font-semibold")}
			onClick={() => trackEvent("landing_cta_clicked", { landing })}
		>
			{label}
		</Link>
	);
}
