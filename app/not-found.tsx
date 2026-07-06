import type { JSX } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound(): JSX.Element {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-8 text-center">
			<p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
				404
			</p>
			<h1 className="text-3xl font-semibold tracking-tight text-foreground">
				This page could not be found.
			</h1>
			<Button
				asChild
				className="bg-foreground text-background rounded-full px-6 hover:bg-foreground hover:opacity-90"
			>
				<Link href="/">Back to home</Link>
			</Button>
		</div>
	);
}
