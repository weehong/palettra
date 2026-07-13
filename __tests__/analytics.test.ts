import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendGAEvent = vi.fn();

vi.mock("client-only", () => ({}));
vi.mock("@next/third-parties/google", () => ({
	sendGAEvent: (...args: Array<unknown>) => sendGAEvent(...args),
}));

async function importAnalytics() {
	vi.resetModules();
	return import("@/lib/analytics");
}

describe("analytics", () => {
	beforeEach(() => {
		sendGAEvent.mockClear();
		window.sessionStorage.clear();
		window.history.replaceState({}, "", "/");
		// NEXT_PUBLIC_* are readonly in env.d.ts; stubEnv mutates safely.
		vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("does nothing when no GA measurement id is configured", async () => {
		const { trackEvent } = await importAnalytics();

		trackEvent("random_palette");

		expect(sendGAEvent).not.toHaveBeenCalled();
	});

	it("forwards events to Google Analytics when configured", async () => {
		vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
		const { trackEvent } = await importAnalytics();

		trackEvent("export_copied", { format: "v4" });

		expect(sendGAEvent).toHaveBeenCalledWith("event", "export_copied", {
			landing_path: "/",
			format: "v4",
		});
	});

	it("preserves first-touch campaign attribution for the session", async () => {
		vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
		window.history.replaceState(
			{},
			"",
			"/tools/tailwind-v4-color-palette?utm_source=reddit&utm_campaign=launch",
		);
		const { trackEvent } = await importAnalytics();

		trackEvent("landing_cta_clicked", { landing: "tailwind-v4" });
		window.history.replaceState({}, "", "/generate/a543bc");
		trackEvent("export_copied", { format: "v4" });

		expect(sendGAEvent).toHaveBeenLastCalledWith(
			"event",
			"export_copied",
			expect.objectContaining({
				landing_path: "/tools/tailwind-v4-color-palette",
				utm_source: "reddit",
				utm_campaign: "launch",
				format: "v4",
			}),
		);
	});

	it("emits once-per-session events only once", async () => {
		vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
		const { trackEventOnce } = await importAnalytics();

		trackEventOnce("activation", "palette_activated", { format: "v4" });
		trackEventOnce("activation", "palette_activated", { format: "v3" });

		expect(sendGAEvent).toHaveBeenCalledTimes(1);
	});
});
