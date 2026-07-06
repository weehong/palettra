---
name: verify
description: How to launch and drive this app to verify changes end-to-end (Palettra, Next.js + Firebase auth)
---

# Verifying Palettra changes

## Launch

Local `.env` has no Firebase vars, so auth is "disabled" (no Sign in/Save/Account UI). To exercise auth UI, start the dev server with the e2e fake config (values from `e2e/fixtures/firebase-env.ts`):

```sh
NEXT_PUBLIC_FIREBASE_API_KEY=e2e-test-api-key \
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=palettra-e2e.firebaseapp.com \
NEXT_PUBLIC_FIREBASE_PROJECT_ID=palettra-e2e \
NEXT_PUBLIC_FIREBASE_APP_ID="1:000000000000:web:e2e0000000000000" \
NEXT_DIST_DIR=.next-e2e npm run dev
```

`NEXT_DIST_DIR` keeps env-baked bundles separate (`.next` = plain dev, `.next-e2e` = fake-Firebase). Server on :3000; wait for `curl -sf localhost:3000`.

## Drive

Use the repo's own Playwright: `import { chromium } from "<repo>/node_modules/playwright/index.mjs"` in an .mjs script (resolves only from inside the repo). With fake Firebase env the app reaches "signed-out": navbar (`body > header`) shows the Palettra brand link + Sign in; Save must be absent. Signed-in flows need the e2e fixtures (popup mock + FirestoreFake) — run `npx playwright test e2e/auth.spec.ts e2e/collection.spec.ts --project=chromium` instead of hand-rolling.

First page hit after server start compiles on demand — hydration can lag; retry once before trusting a FAIL.

## Gotchas

- Playwright e2e uses ports 3100 (main) and 3001 (firebase-disabled project). Interrupted runs orphan `next-server` processes on those ports; `fuser -k 3100/tcp 3001/tcp` before rerunning.
- webkit project fails wholesale in this environment (browser/deps) — judge on chromium + firefox.
- `auth.spec.ts` A6 ("failed popup sign-in surfaces the error banner") hangs in this sandbox: aborting `apis.google.com` makes the Firebase SDK wait forever instead of rejecting. Environmental, not a regression signal.
- Don't run e2e while files are being edited — dev-server Fast Refresh mid-test causes random spec failures.
- `next build` typechecks stale `.next-e2e-disabled/dev/types` (included in tsconfig); if it's corrupt, builds fail on it before reaching app code.
