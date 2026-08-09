/**
 * Dummy Firebase web-app config used by the E2E suite.
 *
 * These values are inlined into the Next.js bundle served on port 3000
 * (see playwright.config.ts) so the auth/collection UI renders, while all
 * Google endpoints are stubbed at the network layer by the fixtures in
 * this directory. CI must build with the same values before `next start`.
 */
export const FIREBASE_TEST_ENV = {
	NEXT_PUBLIC_FIREBASE_API_KEY: "e2e-test-api-key",
	NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "palettra-e2e.firebaseapp.com",
	NEXT_PUBLIC_FIREBASE_PROJECT_ID: "palettra-e2e",
	NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:e2e0000000000000",
} as const;

/**
 * Dummy SMTP config so the navbar "Feedback" button renders. No mail can
 * escape: e2e/feedback.spec.ts stubs POST /api/feedback at the network layer,
 * and the host below does not resolve.
 */
export const FEEDBACK_TEST_ENV = {
	SMTP_HOST: "smtp.invalid",
	SMTP_USER: "e2e@palettra.invalid",
	SMTP_PASSWORD: "e2e-app-password",
	FEEDBACK_TO_EMAIL: "operator@palettra.invalid",
} as const;

/**
 * Explicit empty strings so the disabled-state server on port 3001 ignores
 * any real Firebase values in a developer's local .env file.
 */
export const FIREBASE_DISABLED_ENV = {
	NEXT_PUBLIC_FIREBASE_API_KEY: "",
	NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
	NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
	NEXT_PUBLIC_FIREBASE_APP_ID: "",
} as const;
