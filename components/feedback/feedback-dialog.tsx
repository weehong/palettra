"use client";

import type { FormEvent, JSX } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Send as SendIcon } from "lucide-react";

import type { FeedbackType } from "@/lib/feedback";
import {
	FEEDBACK_TYPES,
	MESSAGE_MAX_LENGTH,
	MESSAGE_MIN_LENGTH,
} from "@/lib/feedback";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";

type FeedbackDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type Status = "idle" | "sending" | "sent";

type FailureReason = "rate_limited" | "server_error" | "network";

function reasonForStatus(status: number): FailureReason {
	return status === 429 ? "rate_limited" : "server_error";
}

/**
 * The form and its state live below the dialog boundary on purpose.
 *
 * Radix unmounts dialog content while closed, so every open gets a fresh
 * component: no reset effect, and the "when did this open" clock that the
 * server's time-gate reads is simply the mount time.
 */
function FeedbackForm(): JSX.Element {
	const { user } = useAuth();
	const [type, setType] = useState<FeedbackType>("general");
	// Prefilled rather than hidden: the submitter should see the address they
	// are about to hand over, and be able to change it.
	const [email, setEmail] = useState<string>(() => user?.email ?? "");
	const [message, setMessage] = useState<string>("");
	const [website, setWebsite] = useState<string>("");
	const [status, setStatus] = useState<Status>("idle");
	const [error, setError] = useState<string | null>(null);
	const openedAtRef = useRef<number>(0);

	// Stamped after mount rather than during render: reading the clock while
	// rendering is impure. Mount is the moment the dialog opened.
	useEffect(() => {
		openedAtRef.current = Date.now();
	}, []);

	async function handleSubmit(
		event: FormEvent<HTMLFormElement>,
	): Promise<void> {
		event.preventDefault();
		setStatus("sending");
		setError(null);

		let response: Response;
		try {
			response = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type,
					email,
					message,
					website,
					elapsedMs: Date.now() - openedAtRef.current,
				}),
			});
		} catch {
			setStatus("idle");
			setError("Could not reach the server. Check your connection and retry.");
			trackEvent("feedback_failed", { reason: "network" });
			return;
		}

		if (!response.ok) {
			const payload = (await response.json().catch(() => null)) as {
				error?: string;
			} | null;
			setStatus("idle");
			setError(payload?.error ?? "Something went wrong. Please try again.");
			trackEvent("feedback_failed", {
				reason: reasonForStatus(response.status),
			});
			return;
		}

		setStatus("sent");
		trackEvent("feedback_submitted", { type });
	}

	if (status === "sent") {
		return (
			<>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<CheckCircle2 className="text-success size-5" aria-hidden />
						Thanks — got it.
					</DialogTitle>
					<DialogDescription>
						{email
							? "We read every message. If this turns into something shipped, we'll email you."
							: "We read every message, even though we can't reply to this one."}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter showCloseButton />
			</>
		);
	}

	const isSending = status === "sending";
	const trimmedMessage = message.trim();
	const canSubmit =
		trimmedMessage.length >= MESSAGE_MIN_LENGTH &&
		trimmedMessage.length <= MESSAGE_MAX_LENGTH;

	return (
		<form onSubmit={(event) => void handleSubmit(event)}>
			<DialogHeader>
				<DialogTitle>Send feedback</DialogTitle>
				<DialogDescription>
					Tell us what is missing, what is broken, or what you wish Palettra
					did.
				</DialogDescription>
			</DialogHeader>

			<div className="mt-4 flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<Label htmlFor="feedback-type">What kind of message?</Label>
					<Select
						value={type}
						onValueChange={(next) => setType(next as FeedbackType)}
						disabled={isSending}
					>
						<SelectTrigger id="feedback-type" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{FEEDBACK_TYPES.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="feedback-email">
						Email{" "}
						<span className="text-muted-foreground font-normal">
							(optional — so we can tell you when it ships)
						</span>
					</Label>
					<Input
						id="feedback-email"
						name="email"
						type="email"
						inputMode="email"
						autoComplete="email"
						placeholder="you@example.com"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						disabled={isSending}
					/>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="feedback-message">Message</Label>
					<Textarea
						id="feedback-message"
						name="message"
						rows={5}
						maxLength={MESSAGE_MAX_LENGTH}
						placeholder="A palette export for…"
						value={message}
						onChange={(event) => setMessage(event.target.value)}
						disabled={isSending}
						required
					/>
					<p className="text-muted-foreground text-right text-xs">
						{trimmedMessage.length}/{MESSAGE_MAX_LENGTH}
					</p>
				</div>

				{/* Honeypot. Positioned off-screen rather than display:none so that
				    form-filling bots still see and complete it. */}
				<div aria-hidden="true" className="sr-only">
					<label htmlFor="feedback-website">Leave this field empty</label>
					<input
						id="feedback-website"
						name="website"
						type="text"
						tabIndex={-1}
						autoComplete="off"
						value={website}
						onChange={(event) => setWebsite(event.target.value)}
					/>
				</div>

				{error ? (
					<p
						role="alert"
						className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
					>
						{error}
					</p>
				) : null}
			</div>

			<DialogFooter className="mt-5 sm:items-center sm:justify-between">
				<p className="text-muted-foreground text-xs">
					We&apos;ll only use your email to reply about this.{" "}
					<Link
						href="/privacy"
						className="hover:text-foreground underline underline-offset-4"
					>
						Privacy
					</Link>
				</p>
				{/* Matches the generator's Export action: the primary fill, toolbar
				    size, pill shape. */}
				<Button
					type="submit"
					size="toolbar"
					disabled={!canSubmit || isSending}
					aria-busy={isSending}
					className="rounded-full px-4 font-semibold shadow-sm disabled:cursor-not-allowed"
				>
					{isSending ? (
						<Spinner label="Sending feedback" />
					) : (
						<>
							<SendIcon aria-hidden="true" />
							Send
						</>
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}

export function FeedbackDialog({
	open,
	onOpenChange,
}: FeedbackDialogProps): JSX.Element {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<FeedbackForm />
			</DialogContent>
		</Dialog>
	);
}
