import { Skeleton } from "@/components/skeleton";
import type {
	ExternalPullRequest,
	WeeklyOwnership,
} from "@/lib/activity/stats";
import type { YearOwnership } from "@/lib/api/get-contributions";
import type { AllTimePullRequest } from "@/lib/api/search";
import { WeeklyOwnershipChart } from "./weekly-ownership-chart";
import { YearOwnershipChart } from "./year-ownership-chart";

interface Item {
	key: string;
	title: string;
	subtitle: string;
	url: string;
}

export function OpenSourceReachSkeleton() {
	return (
		<div className="flex flex-col gap-2">
			<Skeleton className="h-5 w-56" />
			<Skeleton className="h-64 w-full" />
			<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
				<Skeleton className="h-56 w-full" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
				</div>
			</div>
		</div>
	);
}

export function OpenSourceReach({
	recent,
	allTime,
	allTimeTotal,
	allTimeLoading,
	yearly,
	weekly,
}: {
	recent: ExternalPullRequest[];
	allTime: AllTimePullRequest[];
	allTimeTotal: number | null;
	allTimeLoading: boolean;
	yearly: YearOwnership[] | null;
	weekly: WeeklyOwnership[];
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
		return <OpenSourceReachSkeleton />;
	}
	if (allTimeTotal === null && items.length === 0 && !yearly) {
		return (
			<p className="text-sm text-dim">
				No pull requests merged into external repositories found.
			</p>
		);
	}
	return (
		<div className="flex flex-col gap-4">
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
			{yearly && (
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">Past year by contribution type</p>
					<YearOwnershipChart data={yearly} />
				</div>
			)}
			<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 print:grid-cols-2">
				<div className="flex flex-col gap-2 self-stretch">
					<p className="text-sm font-medium">Recent weeks</p>
					<WeeklyOwnershipChart data={weekly} />
					<p className="text-xs text-dim">Own vs external activity per week.</p>
				</div>
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
									className="flex flex-col gap-1 rounded-lg border border-stroke bg-background p-2"
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
