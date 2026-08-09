import { defineConfig, devices } from "@playwright/test";

import {
	FEEDBACK_TEST_ENV,
	FIREBASE_DISABLED_ENV,
	FIREBASE_TEST_ENV,
} from "./e2e/fixtures/firebase-env";

// Dedicated ports and distDirs: this workspace often has other dev servers
// (and agents) running on 3000/3001 with the wrong env, and NEXT_PUBLIC_*
// values are inlined at server start. Never reuse a server the suite didn't
// start itself — a foreign server without the test env makes every auth
// test fail with a misleading "control not rendered" signal.
const PORT = 3100;
const DISABLED_PORT = 3101;
const baseURL = `http://localhost:${PORT}`;
const disabledBaseURL = `http://localhost:${DISABLED_PORT}`;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			testIgnore: /firebase-disabled/,
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
			testIgnore: /firebase-disabled/,
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
			testIgnore: /firebase-disabled/,
		},
		{
			// The disabled state is pure conditional rendering, so one browser
			// is enough. It needs its own server: NEXT_PUBLIC_* vars are
			// inlined at server start, so one server can't serve both states.
			name: "no-firebase-chromium",
			use: { ...devices["Desktop Chrome"], baseURL: disabledBaseURL },
			testMatch: /firebase-disabled/,
		},
	],
	webServer: [
		{
			// Firebase-enabled server. In CI, run `next build` with the same
			// FIREBASE_TEST_ENV values before `playwright test`.
			// Invoke next directly: the `npm run` → `sh -c` wrapper chain can
			// survive Playwright's shutdown kill and leak the server.
			command: process.env.CI
				? `npx next start -p ${PORT}`
				: `npx next dev -p ${PORT}`,
			url: baseURL,
			// Own distDir locally: the default .next belongs to the developer's
			// own dev server (usually without Firebase vars), and Next allows
			// only one dev server per distDir (the lock is <distDir>/lock).
			// CI serves the prod build from the default .next.
			env: {
				...FIREBASE_TEST_ENV,
				...FEEDBACK_TEST_ENV,
				...(process.env.CI ? {} : { NEXT_DIST_DIR: ".next-e2e-on" }),
			},
			reuseExistingServer: false,
			timeout: 120 * 1000,
		},
		{
			// Firebase-disabled server. Dev mode even in CI — a second prod
			// build isn't worth it for a renders-null smoke test.
			command: `npx next dev -p ${DISABLED_PORT}`,
			url: disabledBaseURL,
			env: { ...FIREBASE_DISABLED_ENV, NEXT_DIST_DIR: ".next-e2e-off" },
			reuseExistingServer: false,
			timeout: 120 * 1000,
		},
	],
});
