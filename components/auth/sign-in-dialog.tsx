"use client";

import type { JSX } from "react";
import { useEffect, useState } from "react";

import type { OAuthProviderId } from "@/lib/auth-providers";
import { AUTH_PROVIDERS } from "@/lib/auth-providers";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { trackEvent } from "@/lib/analytics";

type SignInDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function ProviderLogo({ id }: { id: OAuthProviderId }): JSX.Element {
	if (id === "google") {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
				<path
					fill="#4285F4"
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				/>
				<path
					fill="#34A853"
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				/>
				<path
					fill="#FBBC05"
					d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
				/>
				<path
					fill="#EA4335"
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
				/>
			</svg>
		);
	}
	if (id === "twitter") {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
				<path
					fill="currentColor"
					d="M18.9 2h3.3l-7.2 8.2L23.5 22h-6.6l-5.2-6.8L5.8 22H2.5l7.7-8.8L2 2h6.8l4.7 6.2L18.9 2Zm-1.2 17.9h1.8L7.8 4H5.9l11.8 15.9Z"
				/>
			</svg>
		);
	}
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
			<path
				fill="#1877F2"
				d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"
			/>
		</svg>
	);
}

export function SignInDialog({
	open,
	onOpenChange,
}: SignInDialogProps): JSX.Element {
	const { signIn, error, clearError } = useAuth();
	const [pendingProvider, setPendingProvider] =
		useState<OAuthProviderId | null>(null);

	useEffect(() => {
		if (open) {
			clearError();
			trackEvent("sign_in_dialog_opened");
		}
	}, [clearError, open]);

	async function handleSignIn(providerId: OAuthProviderId): Promise<void> {
		setPendingProvider(providerId);
		try {
			await signIn(providerId);
			onOpenChange(false);
		} catch {
			// Error text is owned by AuthProvider.
		} finally {
			setPendingProvider(null);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md" aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Sign in</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-2">
					{AUTH_PROVIDERS.map((provider) => (
						<Button
							key={provider.id}
							variant="outline"
							onClick={() => void handleSignIn(provider.id)}
							disabled={pendingProvider !== null}
							aria-busy={pendingProvider === provider.id}
							className="gap-3 font-semibold disabled:cursor-wait"
						>
							{pendingProvider === provider.id ? (
								<Spinner label={`Signing in with ${provider.name}`} />
							) : (
								<>
									<ProviderLogo id={provider.id} />
									{`Continue with ${provider.name}`}
								</>
							)}
						</Button>
					))}
				</div>

				{error ? (
					<p className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
						{error}
					</p>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
