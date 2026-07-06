import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ToasterProps } from "sonner";
import { Providers } from "@/app/providers";

const toasterState = vi.hoisted(() => ({
	props: null as ToasterProps | null,
}));

vi.mock("sonner", async (importOriginal) => {
	const actual = await importOriginal<typeof import("sonner")>();
	return {
		...actual,
		Toaster: (props: ToasterProps) => {
			toasterState.props = props;
			return <div data-testid="toaster" />;
		},
	};
});

vi.mock("@/components/auth/auth-context", () => ({
	AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("Providers", () => {
	it("uses base font sizing for notifications", () => {
		render(
			<Providers>
				<div>App</div>
			</Providers>,
		);

		expect(toasterState.props?.toastOptions?.classNames?.title).toBe(
			"text-base",
		);
		expect(toasterState.props?.toastOptions?.classNames?.description).toBe(
			"text-base",
		);
	});
});
