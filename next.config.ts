import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Emit a minimal, self-contained server build for Docker (see Dockerfile).
	output: "standalone",
	reactStrictMode: true,
	// Nodemailer resolves transports and TLS at runtime; bundling it breaks
	// those dynamic requires in the standalone server build.
	serverExternalPackages: ["nodemailer"],
	// The dev-server lock lives at <distDir>/lock, so the E2E suite's second
	// (Firebase-disabled) server needs its own distDir to run alongside a
	// regular `next dev` (see playwright.config.ts).
	...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
