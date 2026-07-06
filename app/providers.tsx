"use client";

import type { JSX, ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { AuthProvider } from "@/components/auth/auth-context";

type ProvidersProps = {
	children: ReactNode;
};

/**
 * Client-side application providers.
 *
 * The `QueryClient` is created lazily with `useState` so each browser session
 * gets a single, stable instance that is never shared across requests on the
 * server.
 */
export function Providers({ children }: ProvidersProps): JSX.Element {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>{children}</AuthProvider>
			<Toaster
				theme="system"
				position="bottom-center"
				toastOptions={{
					classNames: {
						title: "text-base",
						description: "text-base",
					},
				}}
			/>
		</QueryClientProvider>
	);
}
