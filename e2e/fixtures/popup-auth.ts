import type { BrowserContext } from "@playwright/test";

/**
 * Forces `signInWithPopup` to fail without Google's real OAuth machinery.
 *
 * Aborting the gapi client load makes the SDK's auth-iframe loader reject,
 * so sign-in rejects with an internal (not popup-blocked) error — which
 * skips the redirect fallback in auth-context.tsx and surfaces the dialog's
 * error banner. This avoids faking the gapi-iframes postMessage handshake,
 * which is not reliably reproducible cross-browser.
 */
export async function stubPopupAutoClose(
	context: BrowserContext,
): Promise<void> {
	await context.route("https://apis.google.com/**", (route) => route.abort());
}
