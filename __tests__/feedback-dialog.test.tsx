import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const authValue = vi.hoisted(() => ({
	user: null as { email: string | null } | null,
}));
const trackEvent = vi.hoisted(() => vi.fn());

vi.mock("@/components/auth/auth-context", () => ({
	useAuth: () => authValue,
}));
vi.mock("@/lib/analytics", () => ({ trackEvent }));

import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { FeedbackLauncher } from "@/components/feedback/feedback-launcher";

const MESSAGE = "Please add a Sass variables export alongside the CSS one.";

function fetchMock(response: Partial<Response> & { json?: () => unknown }) {
	return vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		json: async () => ({ ok: true }),
		...response,
	});
}

beforeEach(() => {
	authValue.user = null;
	trackEvent.mockReset();
});

describe("FeedbackLauncher", () => {
	it("renders nothing when the channel is unconfigured", () => {
		render(<FeedbackLauncher enabled={false} />);

		expect(screen.queryByRole("button", { name: "Feedback" })).toBeNull();
	});

	it("renders an accent-filled trigger when configured", () => {
		render(<FeedbackLauncher enabled />);

		const trigger = screen.getByRole("button", { name: "Feedback" });
		expect(trigger).toHaveAttribute("data-variant", "accent");
	});

	it("opens the dialog and reports it", async () => {
		render(<FeedbackLauncher enabled />);
		fireEvent.click(screen.getByRole("button", { name: "Feedback" }));

		expect(
			await screen.findByRole("heading", { name: "Send feedback" }),
		).toBeInTheDocument();
		expect(trackEvent).toHaveBeenCalledWith("feedback_opened");
	});
});

describe("FeedbackDialog", () => {
	it("prefills the signed-in user's email but leaves it editable", () => {
		authValue.user = { email: "signed-in@example.com" };

		render(<FeedbackDialog open onOpenChange={() => {}} />);

		const email = screen.getByLabelText(/^Email/i);
		expect(email).toHaveValue("signed-in@example.com");
		expect(email).not.toBeDisabled();
	});

	it("keeps Send disabled until the message is long enough", () => {
		render(<FeedbackDialog open onOpenChange={() => {}} />);

		expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

		fireEvent.change(screen.getByLabelText("Message"), {
			target: { value: MESSAGE },
		});

		expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
	});

	it("shows the inline success state after a successful send", async () => {
		vi.stubGlobal("fetch", fetchMock({}));

		render(<FeedbackDialog open onOpenChange={() => {}} />);
		fireEvent.change(screen.getByLabelText("Message"), {
			target: { value: MESSAGE },
		});
		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		expect(await screen.findByText("Thanks — got it.")).toBeInTheDocument();
		expect(screen.queryByLabelText("Message")).toBeNull();
		expect(trackEvent).toHaveBeenCalledWith("feedback_submitted", {
			type: "general",
		});
	});

	it("keeps the typed message and shows the error when the send fails", async () => {
		vi.stubGlobal(
			"fetch",
			fetchMock({
				ok: false,
				status: 502,
				json: async () => ({ error: "Could not send your message." }),
			}),
		);

		render(<FeedbackDialog open onOpenChange={() => {}} />);
		fireEvent.change(screen.getByLabelText("Message"), {
			target: { value: MESSAGE },
		});
		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Could not send your message.",
		);
		expect(screen.getByLabelText("Message")).toHaveValue(MESSAGE);
		await waitFor(() => {
			expect(trackEvent).toHaveBeenCalledWith("feedback_failed", {
				reason: "server_error",
			});
		});
	});

	it("reports a rate-limited send distinctly", async () => {
		vi.stubGlobal(
			"fetch",
			fetchMock({
				ok: false,
				status: 429,
				json: async () => ({ error: "Too many messages." }),
			}),
		);

		render(<FeedbackDialog open onOpenChange={() => {}} />);
		fireEvent.change(screen.getByLabelText("Message"), {
			target: { value: MESSAGE },
		});
		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		await waitFor(() => {
			expect(trackEvent).toHaveBeenCalledWith("feedback_failed", {
				reason: "rate_limited",
			});
		});
	});

	it("surfaces a network failure without claiming success", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

		render(<FeedbackDialog open onOpenChange={() => {}} />);
		fireEvent.change(screen.getByLabelText("Message"), {
			target: { value: MESSAGE },
		});
		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			/could not reach the server/i,
		);
		expect(screen.queryByText("Thanks — got it.")).toBeNull();
		expect(trackEvent).toHaveBeenCalledWith("feedback_failed", {
			reason: "network",
		});
	});

	it("sends the elapsed time and an empty honeypot", async () => {
		const fetchSpy = fetchMock({});
		vi.stubGlobal("fetch", fetchSpy);

		render(<FeedbackDialog open onOpenChange={() => {}} />);
		fireEvent.change(screen.getByLabelText("Message"), {
			target: { value: MESSAGE },
		});
		fireEvent.click(screen.getByRole("button", { name: "Send" }));

		await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
		const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string) as Record<
			string,
			unknown
		>;
		expect(body).toMatchObject({
			type: "general",
			message: MESSAGE,
			website: "",
		});
		expect(typeof body.elapsedMs).toBe("number");
	});
});
