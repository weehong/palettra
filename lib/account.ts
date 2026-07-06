import "client-only";

import type { User } from "firebase/auth";
import { deleteUser, reauthenticateWithPopup } from "firebase/auth";

import type { OAuthProviderId } from "@/lib/auth-providers";
import { createAuthProvider } from "@/lib/auth-providers";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { deleteAllPalettes } from "@/lib/palette-collection";
import { trackEvent } from "@/lib/analytics";

export type AccountDeletionStage =
	| "precondition"
	| "reauth"
	| "data"
	| "auth-delete";

export class AccountDeletionError extends Error {
	stage: AccountDeletionStage;
	code?: string;

	constructor(stage: AccountDeletionStage, cause?: unknown) {
		super("Account deletion failed");
		this.name = "AccountDeletionError";
		this.stage = stage;
		this.code = firebaseErrorCode(cause);
		this.cause = cause;
	}
}

function firebaseErrorCode(error: unknown): string | undefined {
	return typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof error.code === "string"
		? error.code
		: undefined;
}

function providerIdForUser(user: User): OAuthProviderId {
	switch (user.providerData[0]?.providerId) {
		case "twitter.com":
			return "twitter";
		case "facebook.com":
			return "facebook";
		case "google.com":
		default:
			return "google";
	}
}

export async function deleteAccount(): Promise<void> {
	const auth = getFirebaseAuth();
	const db = getFirebaseDb();
	const user = auth?.currentUser;

	if (!auth || !db || !user) {
		throw new AccountDeletionError("precondition");
	}

	try {
		await reauthenticateWithPopup(user, createAuthProvider(providerIdForUser(user)));
	} catch (error) {
		throw new AccountDeletionError("reauth", error);
	}

	try {
		await deleteAllPalettes(db, user.uid);
	} catch (error) {
		throw new AccountDeletionError("data", error);
	}

	try {
		await deleteUser(user);
	} catch (error) {
		throw new AccountDeletionError("auth-delete", error);
	}

	trackEvent("account_deleted");
}
