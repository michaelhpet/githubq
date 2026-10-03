import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/skeleton";
import {
	buildContributionWindow,
	getActivityPatterns,
	getExternalMergedPRs,
	getWeeklyOwnership,
	getWorkHabitMatrix,
	getWorkTypeBreakdown,
} from "@/lib/activity/stats";
import { useActivity } from "@/lib/api/get-activity";
import { useYearContributions } from "@/lib/api/get-contributions";
import { useRepoStats } from "@/lib/api/get-repo-stats";
import { useRepositories } from "@/lib/api/get-repositories";
import { useAllTimeMergedPRs, useLifetimeCounts } from "@/lib/api/search";
import {
	aggregateLanguages,
	aggregateYearlySeries,
	classifyEcosystem,
	getLanguageInsights,
	pickTopRepos,
} from "@/lib/repos/stats";
import { ActivityHighlights } from "./activity-highlights";
import { ContributionMatrix } from "./contribution-matrix";
import { LanguagesEcosystem } from "./languages-ecosystem";
import { OpenSourceReach, OpenSourceReachSkeleton } from "./open-source-reach";
import { WorkHabitGraph } from "./work-habit-graph";
import { WorkTypeRadar } from "./work-type-radar";
import { YearOverview } from "./year-overview";

function ActivitySkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-7 w-48" />
				<Skeleton className="h-5 w-72" />
				<Skeleton className="h-[168px] w-full" />
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-7 w-64" />
				<Skeleton className="h-5 w-80" />
				<Skeleton className="h-36 w-full" />
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-7 w-52" />
				<Skeleton className="h-72 w-full" />
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-7 w-56" />
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<Skeleton className="h-32 w-full" />
					<Skeleton className="h-64 w-full" />
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-7 w-36" />
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(160px,100%),1fr))] gap-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-7 w-44" />
				<OpenSourceReachSkeleton />
			</div>
		</div>
	);
}

export function Activity() {
	const { username } = useParams();
	const {
		data: events,
		isLoading: eventsLoading,
		isError: eventsError,
		error: eventsFetchError,
	} = useActivity(username);
	const { data: repos } = useRepositories(username);
	const topRepos = repos ? pickTopRepos(repos) : [];
	const { data: repoStats, isLoading: repoStatsLoading } = useRepoStats(
		topRepos.map((repo) => repo.full_name),
	);
	const { data: lifetime } = useLifetimeCounts(username);
	const { data: allTimePRs, isLoading: allTimePRsLoading } =
		useAllTimeMergedPRs(username);
	const { data: yearData } = useYearContributions(username);

	if (eventsLoading) return <ActivitySkeleton />;
	if (eventsError && !events) {
		return (
			<p className="text-sm font-medium text-red-500">
				🚫&nbsp;
				{eventsFetchError instanceof Error
					? eventsFetchError.message
					: "Could not load activity"}
			</p>
		);
	}

	const hasEvents = !!events && events.length > 0;
	const activityWindow = hasEvents ? buildContributionWindow(events) : null;
	const breakdown = hasEvents ? getWorkTypeBreakdown(events) : null;
	const patterns = hasEvents ? getActivityPatterns(events) : null;
	const externalPRs = hasEvents
		? getExternalMergedPRs(events, username ?? "")
		: [];
	const weeklyOwnership = hasEvents
		? getWeeklyOwnership(events, username ?? "")
		: [];
	// Authenticated users get the true yearly calendar; everyone else
	// falls back to the trailing public-events window.
	const matrix = yearData
		? {
				total: yearData.total,
				days: yearData.days,
				start: yearData.start,
				end: yearData.end,
				caption: "Public contributions",
			}
		: activityWindow
			? {
					total: activityWindow.total,
					days: activityWindow.days,
					start: activityWindow.start,
					end: activityWindow.end,
					caption: "Based on public activity",
				}
			: null;
	const yearlySeries = aggregateYearlySeries(
		(repoStats ?? []).map((stat) => stat?.participation?.owner),
	);
	const yearlyTotal = yearlySeries.reduce((sum, count) => sum + count, 0);
	const languageShares = aggregateLanguages(
		(repoStats ?? []).map((stat) => stat?.languages),
	);
	const ecosystem = classifyEcosystem(topRepos);
	const languageInsights = getLanguageInsights(topRepos, languageShares);

	return (
		<div className="flex flex-col gap-6">
			{(repoStatsLoading || yearlyTotal > 0) && (
				<article className="flex flex-col gap-2">
					<h3 className="text-lg font-bold">Past year</h3>
					<p className="text-sm text-dim">
						Commits to own top repositories · past 52 weeks
					</p>
					{repoStatsLoading ? (
						<Skeleton className="h-[168px] w-full" />
					) : (
						<YearOverview series={yearlySeries} />
					)}
				</article>
			)}
			{matrix ? (
				<article className="flex flex-col gap-2">
					<h3 className="text-lg font-bold">
						{matrix.total} contributions
						{yearData ? " in the past year" : ""}
					</h3>
					{matrix.start && matrix.end && (
						<p className="text-sm text-dim">
							{matrix.caption} · {matrix.start} – {matrix.end}
						</p>
					)}
					<ContributionMatrix days={matrix.days} />
				</article>
			) : null}
			{hasEvents && breakdown && patterns ? (
				<>
					<article className="flex flex-col gap-2">
						<h3 className="text-lg font-bold">Breakdown of work type</h3>
						<WorkTypeRadar breakdown={breakdown} lifetime={lifetime ?? null} />
					</article>
					<article className="flex flex-col gap-2">
						<h3 className="text-lg font-bold">Highlights</h3>
						<ActivityHighlights patterns={patterns} />
					</article>
					<article className="flex flex-col gap-2">
						<h3 className="text-lg font-bold">Work habits</h3>
						<WorkHabitGraph cells={getWorkHabitMatrix(events)} />
					</article>
				</>
			) : (
				!matrix && (
					<p className="text-sm text-dim">
						No public activity in this window for{" "}
						<span className="font-medium">{username}</span>.
					</p>
				)
			)}
			{(repoStatsLoading || languageShares.length > 0) && (
				<article className="flex flex-col gap-2">
					<h3 className="text-lg font-bold">Languages & ecosystem</h3>
					{repoStatsLoading ? (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-64 w-full" />
						</div>
					) : (
						<LanguagesEcosystem
							shares={languageShares}
							ecosystem={ecosystem}
							insights={languageInsights}
						/>
					)}
				</article>
			)}
			<article className="flex flex-col gap-2">
				<h3 className="text-lg font-bold">Open source reach</h3>
				<OpenSourceReach
					recent={externalPRs}
					allTime={allTimePRs?.items ?? []}
					allTimeTotal={allTimePRs?.total ?? null}
					allTimeLoading={allTimePRsLoading}
					yearly={yearData?.ownership ?? null}
					weekly={weeklyOwnership}
				/>
			</article>
		</div>
	);
}
