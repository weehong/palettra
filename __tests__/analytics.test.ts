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
			format: "v4",
		});
	});
});
