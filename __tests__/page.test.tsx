import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import Home from "@/app/page";
import GeneratePage from "@/app/generate/[hex]/page";
import { siteConfig } from "@/lib/site-config";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("Home page", () => {
	it("does not duplicate the app heading inside the generator page", () => {
		render(<Home />);
		expect(
			screen.queryByRole("heading", {
				level: 1,
				name: siteConfig.headline,
			}),
		).not.toBeInTheDocument();
	});

	it("renders the caption as a bordered card at the sidebar bottom, not in the header", async () => {
		render(<Home />);
		const caption = screen.getByTestId("generator-sidebar-caption");
		for (const item of siteConfig.caption) {
			expect(caption).toHaveTextContent(item);
		}
		expect(within(caption).getAllByRole("listitem")).toHaveLength(
			siteConfig.caption.length,
		);
		expect(caption).toHaveClass("rounded-md", "border", "p-4", "md:mt-auto");
		expect(screen.getByTestId("generator-sidebar-lane")).toContainElement(
			caption,
		);
		expect(document.querySelector("main > header")).not.toBeInTheDocument();

		const page = await GeneratePage({
			params: Promise.resolve({ hex: "a543bc" }),
			searchParams: Promise.resolve({}),
		});
		render(page);
		expect(screen.getAllByTestId("generator-sidebar-caption")[1]).toHaveClass(
			"rounded-md",
			"border",
		);
	});

	it("renders the full 50–950 scale", () => {
		render(<Home />);
		expect(screen.getAllByTestId("swatch")).toHaveLength(11);
	});

	it("uses page scrolling on small screens and a viewport shell on larger screens", () => {
		const { container } = render(<Home />);
		expect(container.querySelector("main")).toHaveClass(
			"flex-none",
			"overflow-visible",
			"md:flex-1",
			"md:min-h-0",
			"md:overflow-hidden",
		);
	});

	it("uses the same viewport shell on generated color routes", async () => {
		const page = await GeneratePage({
			params: Promise.resolve({ hex: "a543bc" }),
			searchParams: Promise.resolve({}),
		});
		const { container } = render(page);
		expect(container.querySelector("main")).toHaveClass(
			"flex-none",
			"overflow-visible",
			"md:flex-1",
			"md:min-h-0",
			"md:overflow-hidden",
		);
	});

	it("applies a different generated palette during client-side navigation", async () => {
		const firstPage = await GeneratePage({
			params: Promise.resolve({ hex: "a543bc" }),
			searchParams: Promise.resolve({}),
		});
		const { rerender } = render(firstPage);
		expect(screen.getByLabelText("Primary hex")).toHaveValue("#a543bc");

		const secondPage = await GeneratePage({
			params: Promise.resolve({ hex: "2563eb" }),
			searchParams: Promise.resolve({}),
		});
		rerender(secondPage);

		expect(screen.getByLabelText("Primary hex")).toHaveValue("#2563eb");
	});

	// AI theme + Apply to site are temporarily withdrawn: pages must not thread
	// the props even when OpenRouter env is configured.
	it("keeps AI theme and Apply to site off the pages while withdrawn", async () => {
		vi.stubEnv("OPENROUTER_API_KEY", "test-key");
		vi.stubEnv("OPENROUTER_MODEL", "test/model");

		render(<Home />);
		expect(screen.queryByTestId("ai-theme-button")).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("apply-to-site-toggle"),
		).not.toBeInTheDocument();

		const page = await GeneratePage({
			params: Promise.resolve({ hex: "a543bc" }),
			searchParams: Promise.resolve({}),
		});
		render(page);
		expect(screen.queryByTestId("ai-theme-button")).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("apply-to-site-toggle"),
		).not.toBeInTheDocument();
	});
});
