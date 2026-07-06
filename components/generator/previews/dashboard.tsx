import type { JSX } from "react";

const STATS = [
	{ label: "Revenue", value: "$48.2k", delta: "+12%" },
	{ label: "Users", value: "2,318", delta: "+4.6%" },
	{ label: "Churn", value: "1.2%", delta: "-0.4%" },
];

const NAV = ["Overview", "Analytics", "Customers", "Settings"];

const BARS = [40, 65, 50, 80, 72, 95, 60];

const ROWS = [
	{ name: "Ada Lovelace", plan: "Pro", status: "Active" },
	{ name: "Alan Turing", plan: "Team", status: "Active" },
	{ name: "Grace Hopper", plan: "Free", status: "Trial" },
];

/** App dashboard: sidebar, stat cards, a mini bar chart, and a table. */
export function DashboardPreview(): JSX.Element {
	return (
		<div className="flex overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
			<aside
				className="hidden w-48 shrink-0 flex-col gap-1 p-4 sm:flex"
				style={{ backgroundColor: "var(--primary-50)" }}
			>
				<div
					className="mb-3 h-8 w-8 rounded-lg"
					style={{ backgroundColor: "var(--primary-600)" }}
				/>
				{NAV.map((item, index) => (
					<span
						key={item}
						className="rounded-md px-3 py-2 text-sm font-medium"
						style={
							index === 0
								? {
										backgroundColor: "var(--primary-600)",
										color: "var(--primary-50)",
									}
								: { color: "var(--primary-900)" }
						}
					>
						{item}
					</span>
				))}
			</aside>

			<div className="flex flex-1 flex-col gap-5 p-5">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{STATS.map((stat) => (
						<div
							key={stat.label}
							className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
						>
							<p className="text-xs text-zinc-500">{stat.label}</p>
							<p className="mt-1 text-2xl font-semibold">{stat.value}</p>
							<p
								className="text-xs font-medium"
								style={{ color: "var(--primary-600)" }}
							>
								{stat.delta}
							</p>
						</div>
					))}
				</div>

				<div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
					<p className="mb-3 text-sm font-medium">Weekly activity</p>
					<div className="flex h-32 items-end gap-2">
						{BARS.map((height, index) => (
							<div
								key={index}
								className="flex-1 rounded-t"
								style={{
									height: `${height}%`,
									backgroundColor: "var(--primary-500)",
								}}
							/>
						))}
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
					<table className="w-full text-left text-sm">
						<thead style={{ backgroundColor: "var(--primary-50)" }}>
							<tr style={{ color: "var(--primary-900)" }}>
								<th className="px-4 py-2 font-medium">Customer</th>
								<th className="px-4 py-2 font-medium">Plan</th>
								<th className="px-4 py-2 font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{ROWS.map((row) => (
								<tr
									key={row.name}
									className="border-t border-zinc-100 dark:border-zinc-800"
								>
									<td className="px-4 py-2">{row.name}</td>
									<td className="px-4 py-2 text-zinc-500">{row.plan}</td>
									<td className="px-4 py-2">
										<span
											className="rounded-full px-2 py-0.5 text-xs font-medium"
											style={{
												backgroundColor: "var(--primary-100)",
												color: "var(--primary-800)",
											}}
										>
											{row.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
