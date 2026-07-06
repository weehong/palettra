import type { JSX } from "react";
import type { Metadata } from "next";

import { AccountSettings } from "@/components/settings/account-settings";

export const metadata: Metadata = {
	title: "Settings",
	robots: { index: false, follow: false },
};

export default function SettingsPage(): JSX.Element {
	return (
		<main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
			<AccountSettings />
		</main>
	);
}
