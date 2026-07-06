/**
 * Ambient type declarations for environment variables.
 *
 * Extend this as new variables are introduced so they are typed throughout the
 * codebase. Public variables must be prefixed with `NEXT_PUBLIC_`.
 */

declare namespace NodeJS {
	interface ProcessEnv {
		readonly NODE_ENV: "development" | "production" | "test";
		/** Absolute origin of the deployed site, e.g. https://palettra.example. */
		readonly NEXT_PUBLIC_SITE_URL?: string;
		readonly NEXT_PUBLIC_FIREBASE_API_KEY?: string;
		readonly NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
		readonly NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
		readonly NEXT_PUBLIC_FIREBASE_APP_ID?: string;
		readonly NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
		readonly NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
		readonly NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
		/** Set by Vercel: which environment the deployment serves. */
		readonly VERCEL_ENV?: "production" | "preview" | "development";
		/** Set by Vercel: domain of this deployment, without protocol. */
		readonly VERCEL_URL?: string;
		/** Set by Vercel: production domain of the project, without protocol. */
		readonly VERCEL_PROJECT_PRODUCTION_URL?: string;
		/** Server-side OpenRouter key for AI theme generation. */
		readonly OPENROUTER_API_KEY?: string;
		/** Optional default OpenRouter model for AI theme generation. */
		readonly OPENROUTER_MODEL?: string;
	}
}
