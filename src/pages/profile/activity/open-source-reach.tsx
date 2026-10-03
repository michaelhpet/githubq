import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/skeleton";
import type {
	ExternalPullRequest,
	RepoOwnershipSplit,
} from "@/lib/activity/stats";
import type { AllTimePullRequest } from "@/lib/api/search";

interface Item {
	key: string;
	title: string;
	subtitle: string;
	url: string;
}

export function OpenSourceReach({
	recent,
	allTime,
	allTimeTotal,
	allTimeLoading,
	split,
}: {
	recent: ExternalPullRequest[];
	allTime: AllTimePullRequest[];
	allTimeTotal: number | null;
	allTimeLoading: boolean;
	split: RepoOwnershipSplit[];
}) {
	const items: Item[] =
		allTime.length > 0
			? allTime.slice(0, 5).map((pr) => ({
					key: `${pr.repo}#${pr.number}`,
					title: `${pr.title} #${pr.number}`,
					subtitle: pr.repo,
					url: pr.url,
				}))
			: recent.slice(0, 5).map((pr) => ({
					key: `${pr.repo}#${pr.number}`,
					title: `${pr.title} #${pr.number}`,
					subtitle: pr.repo,
					url: pr.url,
				}));

	if (allTimeLoading && items.length === 0) {
		return (
			<div className="flex flex-col gap-2">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		);
	}
	if (allTimeTotal === null && items.length === 0) {
		return (
			<p className="text-sm text-dim">
				No pull requests merged into external repositories found.
			</p>
		);
	}
	return (
		<div className="flex flex-col gap-2">
			<p className="text-sm">
				<span className="font-bold">
					{(allTimeTotal ?? recent.length).toLocaleString()}
				</span>{" "}
				merged pull request
				{(allTimeTotal ?? recent.length) === 1 ? "" : "s"}
				<span className="text-dim">
					{" "}
					·{" "}
					{allTime.length > 0
						? "all time · all repositories"
						: "in this window · external only"}
				</span>
			</p>
			<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 print:grid-cols-2">
				{split.length > 0 && (
					<div className="flex flex-col gap-2">
						<div className="h-52 w-full text-dim">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={split}
										dataKey="value"
										nameKey="name"
										innerRadius="55%"
										outerRadius="80%"
										paddingAngle={2}
									>
										{split.map((entry) => (
											<Cell
												key={entry.name}
												fill={
													entry.name === "Own repositories"
														? "#0c8ce9"
														: "#8b949e"
												}
											/>
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											backgroundColor: "rgb(var(--paper))",
											border: "1px solid rgb(var(--stroke))",
											borderRadius: 8,
											fontSize: 12,
										}}
										formatter={(value) => [
											`${typeof value === "number" ? value : 0} events`,
											"",
										]}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
						<ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim">
							{split.map((entry) => (
								<li key={entry.name} className="flex items-center gap-1">
									<span
										aria-hidden="true"
										className="h-2 w-2 rounded-full"
										style={{
											backgroundColor:
												entry.name === "Own repositories"
													? "#0c8ce9"
													: "#8b949e",
										}}
									/>
									{entry.name}: {entry.value}
								</li>
							))}
						</ul>
						<p className="text-xs text-dim">
							Share of recent activity in own vs external repositories.
						</p>
					</div>
				)}
				{items.length > 0 && (
					<div className="flex flex-col gap-2">
						{allTime.length > 0 && (
							<p className="text-xs text-dim">
								Most recent in external repositories:
							</p>
						)}
						<ul className="flex flex-col gap-2">
							{items.map((item) => (
								<li
									key={item.key}
									className="flex flex-col gap-1 rounded-lg border-2 border-stroke bg-background p-2"
								>
									<a
										href={item.url}
										target="_blank"
										rel="noreferrer"
										className="text-sm font-medium hover:underline"
									>
										{item.title}
									</a>
									<p className="text-xs text-dim">{item.subtitle}</p>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
