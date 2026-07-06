import type { BrowserContext, Page } from "@playwright/test";
import { test as base, expect } from "@playwright/test";

import { FIREBASE_TEST_ENV } from "./firebase-env";

/**
 * Signed-in state is produced by seeding Firebase Auth's IndexedDB
 * persistence, not by driving the OAuth popup: `onAuthStateChanged` fires
 * with the persisted user and the app code under test runs unmodified.
 * The record shape below is SDK-internal (firebase ^12) — the canary test
 * in auth.spec.ts exists to blame this fixture, not the app, if an SDK
 * upgrade changes it.
 */

export const TEST_USER = {
	uid: "e2e-user-1",
	email: "e2e@example.com",
	displayName: "E2E Tester",
} as const;

const PROJECT_ID = FIREBASE_TEST_ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = FIREBASE_TEST_ENV.NEXT_PUBLIC_FIREBASE_API_KEY;

function base64url(value: string): string {
	return Buffer.from(value)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

/** Unsigned JWT — the SDK only parses claims; nothing verifies signatures. */
export function fakeJwt(expiresInMs = 3_600_000): string {
	const nowSeconds = Math.floor(Date.now() / 1000);
	const header = { alg: "none", typ: "JWT" };
	const payload = {
		iss: `https://securetoken.google.com/${PROJECT_ID}`,
		aud: PROJECT_ID,
		auth_time: nowSeconds,
		user_id: TEST_USER.uid,
		sub: TEST_USER.uid,
		iat: nowSeconds,
		exp: nowSeconds + Math.floor(expiresInMs / 1000),
		email: TEST_USER.email,
		email_verified: true,
		firebase: { identities: {}, sign_in_provider: "google.com" },
	};
	return `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}.`;
}

/**
 * Stubs every Google endpoint the Firebase SDK may call. Registered
 * catch-alls first: Playwright matches routes in reverse registration
 * order, so more specific stubs (and the Firestore mock, installed later
 * by collection tests) take precedence.
 */
export async function stubGoogleAuthApis(
	context: BrowserContext,
): Promise<void> {
	await context.route("https://*.googleapis.com/**", (route) =>
		route.fulfill({
			status: 404,
			contentType: "application/json",
			body: JSON.stringify({
				error: { code: 404, message: "E2E: unstubbed googleapis request" },
			}),
		}),
	);
	await context.route("https://apis.google.com/**", (route) =>
		route.fulfill({ status: 404, body: "E2E: unstubbed" }),
	);
	// The font picker loads preview stylesheets at runtime; keep those out of
	// the catch-all so they don't surface as 404 noise.
	await context.route("https://fonts.googleapis.com/**", (route) =>
		route.fulfill({ contentType: "text/css", body: "" }),
	);

	await context.route("https://identitytoolkit.googleapis.com/**", (route) => {
		if (route.request().url().includes("accounts:lookup")) {
			const now = `${Date.now()}`;
			return route.fulfill({
				json: {
					kind: "identitytoolkit#GetAccountInfoResponse",
					users: [
						{
							localId: TEST_USER.uid,
							email: TEST_USER.email,
							emailVerified: true,
							displayName: TEST_USER.displayName,
							providerUserInfo: [
								{
									providerId: "google.com",
									rawId: "e2e-google-raw-id",
									email: TEST_USER.email,
									displayName: TEST_USER.displayName,
								},
							],
							validSince: "0",
							lastLoginAt: now,
							createdAt: now,
						},
					],
				},
			});
		}
		return route.fulfill({
			status: 404,
			contentType: "application/json",
			body: JSON.stringify({
				error: { code: 404, message: "E2E: unstubbed identitytoolkit call" },
			}),
		});
	});

	await context.route("https://securetoken.googleapis.com/**", (route) =>
		route.fulfill({
			json: {
				access_token: fakeJwt(),
				expires_in: "3600",
				token_type: "Bearer",
				refresh_token: "e2e-refresh-token",
				id_token: fakeJwt(),
				user_id: TEST_USER.uid,
				project_id: PROJECT_ID,
			},
		}),
	);
}

/**
 * Seeds Firebase Auth persistence so the next app navigation boots
 * signed-in. Visits /robots.txt first: same origin for IndexedDB, but no
 * app JS, so the SDK can't race the write.
 */
export async function seedSignedInUser(page: Page): Promise<void> {
	const record = {
		fbase_key: `firebase:authUser:${API_KEY}:[DEFAULT]`,
		value: {
			uid: TEST_USER.uid,
			email: TEST_USER.email,
			emailVerified: true,
			displayName: TEST_USER.displayName,
			isAnonymous: false,
			photoURL: null,
			providerData: [
				{
					providerId: "google.com",
					uid: "e2e-google-raw-id",
					displayName: TEST_USER.displayName,
					email: TEST_USER.email,
					phoneNumber: null,
					photoURL: null,
				},
			],
			stsTokenManager: {
				refreshToken: "e2e-refresh-token",
				accessToken: fakeJwt(),
				expirationTime: Date.now() + 3_600_000,
			},
			createdAt: `${Date.now()}`,
			lastLoginAt: `${Date.now()}`,
			apiKey: API_KEY,
			appName: "[DEFAULT]",
		},
	};

	await page.goto("/robots.txt");
	await page.evaluate(async (seed) => {
		await new Promise<void>((resolve, reject) => {
			const open = indexedDB.open("firebaseLocalStorageDb", 1);
			open.onupgradeneeded = () => {
				open.result.createObjectStore("firebaseLocalStorage", {
					keyPath: "fbase_key",
				});
			};
			open.onsuccess = () => {
				const db = open.result;
				const tx = db.transaction("firebaseLocalStorage", "readwrite");
				tx.objectStore("firebaseLocalStorage").put(seed);
				tx.oncomplete = () => {
					db.close();
					resolve();
				};
				tx.onerror = () => reject(tx.error ?? new Error("IDB seed failed"));
			};
			open.onerror = () => reject(open.error ?? new Error("IDB open failed"));
		});
	}, record);
}

/** `test` with all Google endpoints stubbed before any page exists. */
export const test = base.extend({
	context: async ({ context }, use) => {
		await stubGoogleAuthApis(context);
		// `use` is Playwright's fixture callback, not the React `use` hook.
		// eslint-disable-next-line react-hooks/rules-of-hooks
		await use(context);
	},
});

export { expect };
