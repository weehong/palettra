"use client";

import type { JSX } from "react";
import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";

import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

type FeedbackLauncherProps = {
	/**
	 * Whether SMTP is configured on the server. A permanently-visible button
	 * that always fails is worse than no button, so an unconfigured deployment
	 * renders nothing at all.
	 */
	enabled: boolean;
};

export function FeedbackLauncher({
	enabled,
}: FeedbackLauncherProps): JSX.Element | null {
	const [open, setOpen] = useState(false);

	if (!enabled) {
		return null;
	}

	function openFeedback(): void {
		setOpen(true);
		trackEvent("feedback_opened");
	}

	return (
		<>
			<Button variant="accent" onClick={openFeedback} className="font-semibold">
				<MessageSquarePlus />
				{/* Narrow viewports get the icon alone, but the accessible name
				    stays put in every layout. */}
				<span className="sr-only sm:not-sr-only">Feedback</span>
			</Button>
			<FeedbackDialog open={open} onOpenChange={setOpen} />
		</>
	);
}
