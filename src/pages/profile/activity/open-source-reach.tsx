import { Skeleton } from "@/components/skeleton";
import type { ExternalPullRequest } from "@/lib/activity/stats";
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
}: {
	recent: ExternalPullRequest[];
	allTime: AllTimePullRequest[];
	allTimeTotal: number | null;
	allTimeLoading: boolean;
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
			{allTime.length > 0 && items.length > 0 && (
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
	);
}
