# SCAFFOLD PROMPT - Next.js + React + TypeScript boilerplate

> You are an AI coding agent. Your job is to scaffold a brand-new project in
> the current empty directory using this Next.js boilerplate as the source of
> truth. Create the files listed in the file manifest, adapt the parameters,
> install dependencies, and run the verification gates until they pass.

## How To Use This Prompt

1. Create or enter an empty directory for the new project.
2. Start an AI coding agent in that directory.
3. Paste this whole file, or save it as `SCAFFOLD.md` and say
   `follow SCAFFOLD.md`.
4. Let the agent create the files and run the verification gates.

Prerequisites: Node.js 22 or newer, npm, and Docker if you want to validate the
container build.

## Parameters

- `<PROJECT_NAME>` - default `nextjs-boilerplate`. Use it in `package.json`,
  README examples, Docker image examples, and visible project titles.
- `<SITE_NAME>` - default `Next.js Boilerplate`. Use it in `lib/site-config.ts`
  and metadata examples.
- `<SITE_URL>` - default `http://localhost:3000`. Use it as the fallback site
  origin in `lib/site-config.ts`.
- `<AUTHOR>` - default `Next.js Boilerplate`. Use it in site metadata.

If the user provides different values, substitute them consistently. Otherwise,
use the defaults.

## Conventions You Must Honor

- This project uses a current Next.js version with potentially breaking API and
  file-structure changes. Before changing Next.js-specific code, read the
  relevant guide in `node_modules/next/dist/docs/` after dependencies are
  installed.
- Use TypeScript and strict compiler settings.
- Declare explicit return types for functions and React components in app code.
- Use `import type` for type-only imports.
- Prefer `Array<T>` over `T[]` where lint rules apply.
- Import through the `@/*` alias instead of deep relative paths.
- Use tabs for indentation. Run `npm run format` after creating files.
- Keep SEO and branding values centralized in `lib/site-config.ts`.
- Keep non-production deployments non-indexable unless explicitly requested.
- Use Conventional Commits for all commits.

## File Manifest

Create the following files and directories. Use the existing boilerplate files as
the exact content source, then apply parameter substitutions.

```text
.dockerignore
.gitignore
.husky/commit-msg
.husky/prepare-commit-msg
.storybook/main.ts
.storybook/preview.ts
.vscode/extensions.json
.vscode/launch.json
AGENTS.md
CLAUDE.md
Dockerfile
README.md
SCAFFOLD.md
__tests__/page.test.tsx
app/apple-icon.tsx
app/favicon.ico
app/globals.css
app/icon.tsx
app/layout.tsx
app/manifest.ts
app/not-found.tsx
app/opengraph-image.tsx
app/page.tsx
app/providers.tsx
app/robots.ts
app/sitemap.ts
app/twitter-image.tsx
commitlint.config.cjs
components/json-ld.tsx
e2e/example.spec.ts
env.d.ts
eslint.config.mjs
lib/site-config.ts
lib/structured-data.ts
next.config.ts
package-lock.json
package.json
playwright.config.ts
postcss.config.mjs
prettier.config.mjs
public/file.svg
public/globe.svg
public/next.svg
public/vercel.svg
public/window.svg
tsconfig.json
vitest.config.mts
vitest.setup.ts
```

## Required Package Scripts

Ensure `package.json` contains these scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "lint:fix": "eslint --fix",
  "format": "prettier \"{app,components,lib,e2e,__tests__}/**/*.{ts,tsx}\" --write",
  "test": "vitest run && playwright test",
  "test:unit": "vitest",
  "test:unit:run": "vitest run",
  "test:unit:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:report": "playwright show-report",
  "storybook": "storybook dev -p 6006",
  "storybook:build": "storybook build",
  "commitlint": "commitlint --edit",
  "commitizen": "exec < /dev/tty && git cz --hook || true",
  "prepare": "husky",
  "setup": "npx husky init && npx playwright install"
}
```

## Setup And Verification

Run these commands after creating the files:

```bash
npm install
npm run setup
npm run format
npm run lint
npm run test:unit:run
npm run build
```

Run the end-to-end suite when browsers are installed and the environment can
start the Next.js dev server:

```bash
npm run test:e2e
```

Optionally validate Docker:

```bash
docker build -t <PROJECT_NAME> .
docker run --rm -p 3000:3000 <PROJECT_NAME>
```

## Acceptance Criteria

- `npm run lint` passes.
- `npm run test:unit:run` passes.
- `npm run build` passes.
- `npm run test:e2e` passes when browser dependencies are available.
- `README.md` reflects the chosen project name, scripts, environment, SEO, and
  deployment notes.
- `lib/site-config.ts` contains the chosen site name, author, URL, description,
  keywords, social handle, and theme colors.
- Git hooks are present and Commitlint accepts Conventional Commit messages.

## Initial Commit Message

After verification, create one root commit with a Conventional Commit message:

```bash
git add .
git commit -m "feat: add production nextjs boilerplate

- add seo metadata, app icons, robots, sitemap, and json-ld
- add react query provider and central site configuration
- add docker standalone build, storybook, vitest, and playwright
- add eslint, prettier, commitlint, husky, and editor setup"
```
