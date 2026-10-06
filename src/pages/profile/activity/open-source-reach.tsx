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

export function OpenSourceReachSkeleton({
	isAuthed = true,
}: {
	isAuthed?: boolean;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-5 w-56" />
			<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 print:grid-cols-2">
				{isAuthed && <Skeleton className="h-64 w-full" />}
				<div
					className={`flex flex-col gap-2 ${isAuthed ? "" : "md:col-span-2"}`}
				>
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-56" />
					<Skeleton className="h-56 w-full" />
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-16 w-full" />
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
	isAuthed = true,
}: {
	recent: ExternalPullRequest[];
	allTime: AllTimePullRequest[];
	allTimeTotal: number | null;
	allTimeLoading: boolean;
	yearly: YearOwnership[] | null;
	weekly: WeeklyOwnership[];
	isAuthed?: boolean;
}) {
	const visibleAllTime = isAuthed ? allTime : [];
	const visibleAllTimeTotal = isAuthed ? allTimeTotal : null;
	const visibleYearly = isAuthed ? yearly : null;
	const items: Item[] =
		visibleAllTime.length > 0
			? visibleAllTime.slice(0, 5).map((pr) => ({
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
		return <OpenSourceReachSkeleton isAuthed={isAuthed} />;
	}
	if (
		visibleAllTimeTotal === null &&
		items.length === 0 &&
		!visibleYearly
	) {
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
					{(visibleAllTimeTotal ?? recent.length).toLocaleString()}
				</span>{" "}
				merged pull request
				{(visibleAllTimeTotal ?? recent.length) === 1 ? "" : "s"}
				<span className="text-dim">
					{" "}
					·{" "}
					{visibleAllTime.length > 0
						? "all time · all repositories"
						: "in this window · external only"}
				</span>
			</p>
			<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 print:grid-cols-2">
				{visibleYearly && (
					<div className="flex flex-col gap-2">
						<p className="text-sm font-medium">
							Past year by contribution type
						</p>
						<YearOwnershipChart data={visibleYearly} />
					</div>
				)}
				<div
					className={`flex flex-col gap-2 self-stretch ${visibleYearly ? "" : "md:col-span-2"}`}
				>
					<p className="text-sm font-medium">Recent weeks</p>
					{weekly.some((week) => week.own + week.external > 0) ? (
						<>
							<p className="text-xs text-dim">
								Own vs external activity per week.
							</p>
							<WeeklyOwnershipChart data={weekly} />
						</>
					) : (
						<p className="text-xs text-dim">No activity in recent weeks.</p>
					)}
				</div>
			</div>
			{items.length > 0 && (
				<div className="flex flex-col gap-2">
					{visibleAllTime.length > 0 && (
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
	);
}
