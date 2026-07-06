import type { JSX } from "react";

const TIERS = [
	{
		name: "Starter",
		price: "$0",
		features: ["1 project", "Community support", "1 GB storage"],
		featured: false,
	},
	{
		name: "Pro",
		price: "$24",
		features: ["Unlimited projects", "Priority support", "100 GB storage"],
		featured: true,
	},
	{
		name: "Team",
		price: "$80",
		features: ["Everything in Pro", "SSO & roles", "Audit log"],
		featured: false,
	},
];

/** Pricing cards, with the middle tier featured using the primary role. */
export function CardsPreview(): JSX.Element {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{TIERS.map((tier) => (
				<div
					key={tier.name}
					className="flex flex-col gap-4 rounded-xl border p-6"
					style={
						tier.featured
							? {
									borderColor: "var(--primary-600)",
									backgroundColor: "var(--primary-50)",
								}
							: { borderColor: "rgb(228 228 231)" }
					}
				>
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
							{tier.name}
						</h3>
						{tier.featured ? (
							<span
								className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
								style={{ backgroundColor: "var(--primary-600)" }}
							>
								Popular
							</span>
						) : null}
					</div>
					<p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
						{tier.price}
						<span className="text-sm font-normal text-zinc-500">/mo</span>
					</p>
					<ul className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
						{tier.features.map((feature) => (
							<li key={feature} className="flex items-center gap-2">
								<span
									className="inline-block h-1.5 w-1.5 rounded-full"
									style={{ backgroundColor: "var(--primary-500)" }}
								/>
								{feature}
							</li>
						))}
					</ul>
					<button
						type="button"
						className="mt-auto rounded-md px-4 py-2 text-sm font-semibold"
						style={
							tier.featured
								? { backgroundColor: "var(--primary-600)", color: "#fff" }
								: {
										backgroundColor: "var(--primary-100)",
										color: "var(--primary-800)",
									}
						}
					>
						Choose {tier.name}
					</button>
				</div>
			))}
		</div>
	);
}
