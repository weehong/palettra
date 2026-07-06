import type { AuthProvider } from "firebase/auth";
import {
	FacebookAuthProvider,
	GoogleAuthProvider,
	TwitterAuthProvider,
} from "firebase/auth";

export type OAuthProviderId = "google" | "twitter" | "facebook";

export const AUTH_PROVIDERS: ReadonlyArray<{
	id: OAuthProviderId;
	name: string;
}> = [
	{ id: "google", name: "Google" },
	{ id: "twitter", name: "Twitter" },
	{ id: "facebook", name: "Facebook" },
];

export function createAuthProvider(id: OAuthProviderId): AuthProvider {
	switch (id) {
		case "google":
			return new GoogleAuthProvider();
		case "twitter":
			return new TwitterAuthProvider();
		case "facebook":
			return new FacebookAuthProvider();
	}
}
