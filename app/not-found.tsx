import type { JSX } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound(): JSX.Element {
	return (
		<div className="bg-background flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
			<p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
				404
			</p>
			<h1 className="text-foreground text-3xl font-semibold tracking-tight">
				This page could not be found.
			</h1>
			<Button
				asChild
				size="lg"
				className="bg-foreground text-background hover:bg-foreground rounded-full hover:opacity-90"
			>
				<Link href="/">Back to home</Link>
			</Button>
		</div>
	);
}
