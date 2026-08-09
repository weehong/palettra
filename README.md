# Palettra

Palettra is a Tailwind color system generator for turning a single hex color
into a complete design-system starter: OKLCH-tuned 50-950 scales, semantic color
roles, neutral and status palettes, typography pairing, real UI previews, WCAG
contrast checks, and exports for Tailwind, CSS variables, and Figma tokens.

Live site: [palettra.design](https://palettra.design)

## Features

- Generate Tailwind-ready 50-950 color scales from any hex color.
- Build multi-role palettes for primary, secondary, tertiary, neutral, error,
  success, and warning colors.
- Import palettes from Coolors, UIColors, and Google Stitch.
- Preview themes across dashboard, website, cards, charts, Material-style UI,
  design-system, branding, gradient, component, and typography examples.
- Check WCAG contrast grades inside the preview workflow.
- Pair Google fonts and tune type scales alongside color tokens.
- Export Tailwind v3 config, Tailwind v4 CSS, CSS variables, and Figma token
  JSON.
- Share generated systems through URL-encoded palette state.
- Save palettes to a personal collection with Firebase Auth and Cloud Firestore.

## Tech Stack

- Next.js 16 App Router, React 19, and TypeScript.
- Tailwind CSS v4 through the PostCSS plugin.
- Firebase Auth and Cloud Firestore for saved palettes.
- TanStack React Query for client data flow.
- Vitest and React Testing Library for unit tests.
- Playwright for end-to-end tests.
- Storybook 10 for isolated component work.
- ESLint, Prettier, Commitlint, Commitizen, and Husky for project hygiene.

## Getting Started

Requires Node.js 22+ and npm.

```bash
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script                       | Description                            |
| ---------------------------- | -------------------------------------- |
| `npm run dev`                | Start the local Next.js dev server.    |
| `npm run build`              | Build the production app.              |
| `npm run start`              | Serve a production build.              |
| `npm run lint`               | Run ESLint.                            |
| `npm run lint:fix`           | Run ESLint with autofix.               |
| `npm run typecheck`          | Run TypeScript without emitting files. |
| `npm run format`             | Format source files with Prettier.     |
| `npm run test`               | Run unit tests, then end-to-end tests. |
| `npm run test:unit`          | Run Vitest in watch mode.              |
| `npm run test:unit:run`      | Run Vitest once.                       |
| `npm run test:unit:coverage` | Run Vitest with coverage.              |
| `npm run test:e2e`           | Run Playwright tests.                  |
| `npm run test:e2e:report`    | Open the Playwright HTML report.       |
| `npm run storybook`          | Start Storybook on port 6006.          |
| `npm run storybook:build`    | Build a static Storybook.              |

## Environment

Public site metadata is centralized in `lib/site-config.ts`.

| Variable               | Required | Description                                                                                         |
| ---------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | No       | Canonical origin. Defaults to localhost in development and `https://palettra.design` in production. |

Copy `.env.example` to `.env.local` for local Firebase and analytics settings.

| Variable                                   | Required | Description                                 |
| ------------------------------------------ | -------- | ------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Yes      | Firebase Web App API key.                   |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Yes      | Firebase Auth domain.                       |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Yes      | Firebase project id for Auth and Firestore. |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Yes      | Firebase Web App id.                        |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | No       | Optional Firebase storage bucket.           |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | No       | Optional Firebase messaging sender id.      |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`            | No       | GA4 measurement id.                         |

### Feedback Channel

The navbar "Feedback" button opens a dialog that emails feedback, feature
requests, and bug reports to the operator's mailbox over SMTP. Nothing is
persisted and the submitter never gets an auto-reply — see
[ADR 0001](docs/adr/0001-feedback-is-email-only.md) for why.

| Variable             | Required | Description                                                       |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `SMTP_HOST`          | Yes      | SMTP server, e.g. `smtp.gmail.com`.                               |
| `SMTP_USER`          | Yes      | Authenticated transport account. Also the `From` address.         |
| `SMTP_PASSWORD`      | Yes      | App password for that account.                                    |
| `SMTP_PORT`          | No       | Defaults to `587` (STARTTLS). Port `465` uses implicit TLS.       |
| `FEEDBACK_TO_EMAIL`  | No       | Destination mailbox. Defaults to `SMTP_USER`.                     |
| `FEEDBACK_FROM_NAME` | No       | `From` display name. Defaults to `Palettra Feedback`.             |

The button renders only when host, user, and password are all set, so an
unconfigured deployment shows nothing rather than a button that always fails.
That flag is resolved when a page is rendered, so a Docker deployment that
supplies these variables only at `docker run` will not show the button on
statically prebuilt routes — pass them at build time as well.

Gmail app passwords are issued at <https://myaccount.google.com/apppasswords>.
Microsoft/Outlook accounts are retiring basic-auth SMTP, so an Outlook
user/password pair may be rejected even when it is correct.

Enable Google, Twitter, and Facebook sign-in providers in Firebase
Authentication if account features are used. Deploy the owner-scoped Firestore
rules from this repository:

```bash
firebase deploy --only firestore:rules
```

## Metadata And SEO

`lib/site-config.ts` is the source of truth for app metadata: product name,
title, description, keywords, author, theme colors, social handle, and canonical
origin. Next metadata, the web manifest, generated Open Graph/Twitter images,
structured data, `robots.txt`, and `sitemap.xml` all read from that config.

Non-production deployments are non-indexable by default. On Vercel,
`VERCEL_ENV=production` is required before robots metadata allows indexing.

The GitHub repository metadata mirrors the same product positioning:

- Description: Tailwind color system generator for OKLCH palettes, typography,
  UI previews, WCAG contrast checks, and design-token exports.
- Homepage: <https://palettra.design>
- Topics: `tailwind-css`, `color-palette`, `color-system`, `oklch`,
  `design-tokens`, `figma-tokens`, `wcag`, `typography`, `nextjs`.

## Testing

```bash
npm run lint
npm run typecheck
npm run test:unit:run
npm run test:e2e
```

The Playwright config starts the Next.js server automatically for end-to-end
tests.

## Deployment

### Vercel

Deploy the app to Vercel and set `NEXT_PUBLIC_SITE_URL=https://palettra.design`
for production so canonical URLs, sitemap entries, and social metadata use the
custom domain.

### Docker

The app builds to a standalone Next.js server through `output: "standalone"` in
`next.config.ts`.

```bash
docker build -t palettra .
docker run --rm -p 3000:3000 palettra
```

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org).
Commit messages are validated by Commitlint through a Husky `commit-msg` hook,
and Commitizen is available with `git cz`.
