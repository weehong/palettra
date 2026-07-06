"use client";

import type { JSX, ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { User } from "firebase/auth";
import {
	getRedirectResult,
	onAuthStateChanged,
	signInWithPopup,
	signInWithRedirect,
	signOut as firebaseSignOut,
} from "firebase/auth";

import type { OAuthProviderId } from "@/lib/auth-providers";
import { createAuthProvider } from "@/lib/auth-providers";
import { getFirebaseAuth, isFirebaseEnabled } from "@/lib/firebase";
import { trackEvent } from "@/lib/analytics";

type AuthStatus = "disabled" | "loading" | "signed-in" | "signed-out";

type AuthContextValue = {
	user: User | null;
	status: AuthStatus;
	error: string | null;
	signIn: (providerId: OAuthProviderId) => Promise<void>;
	signOut: () => Promise<void>;
	clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const disabledAuthContext: AuthContextValue = {
	user: null,
	status: "disabled",
	error: null,
	signIn: async () => {},
	signOut: async () => {},
	clearError: () => {},
};

type AuthProviderProps = {
	children: ReactNode;
};

function authErrorCode(error: unknown): string {
	return typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof error.code === "string"
		? error.code
		: "unknown";
}

function authErrorMessage(error: unknown): string {
	const code = authErrorCode(error);
	if (code === "auth/account-exists-with-different-credential") {
		return "An account already exists for this email. Sign in with the provider you used originally.";
	}
	return "Sign in failed. Try again or use another provider.";
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
	const [user, setUser] = useState<User | null>(null);
	const [status, setStatus] = useState<AuthStatus>(() =>
		isFirebaseEnabled() ? "loading" : "disabled",
	);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isFirebaseEnabled()) {
			return;
		}

		const auth = getFirebaseAuth();
		if (!auth) {
			return;
		}

		void getRedirectResult(auth).catch((err: unknown) => {
			const code = authErrorCode(err);
			setError(authErrorMessage(err));
			trackEvent("login_error", { error_code: code, method: "redirect" });
		});

		return onAuthStateChanged(auth, (nextUser) => {
			setUser(nextUser);
			setStatus(nextUser ? "signed-in" : "signed-out");
		});
	}, []);

	const signIn = useCallback(
		async (providerId: OAuthProviderId): Promise<void> => {
			const auth = getFirebaseAuth();
			if (!auth) {
				setError("Sign in is not configured for this deployment.");
				setStatus("disabled");
				return;
			}

			setError(null);
			const provider = createAuthProvider(providerId);
			try {
				await signInWithPopup(auth, provider);
				trackEvent("login", { method: providerId });
			} catch (err) {
				const code = authErrorCode(err);
				if (
					code === "auth/popup-blocked" ||
					code === "auth/operation-not-supported-in-this-environment"
				) {
					await signInWithRedirect(auth, provider);
					return;
				}
				setError(authErrorMessage(err));
				trackEvent("login_error", { error_code: code, method: providerId });
				throw err;
			}
		},
		[],
	);

	const signOut = useCallback(async (): Promise<void> => {
		const auth = getFirebaseAuth();
		if (!auth) {
			return;
		}
		await firebaseSignOut(auth);
		trackEvent("logout");
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			status,
			error,
			signIn,
			signOut,
			clearError: () => setError(null),
		}),
		[error, signIn, signOut, status, user],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		return disabledAuthContext;
	}
	return context;
}
