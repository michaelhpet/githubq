import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/skeleton";
import { useSession } from "@/lib/auth/session";
import {
	buildContributionWindow,
	getActivityPatterns,
	getExternalMergedPRs,
	getWeeklyOwnership,
	getWorkHabitMatrix,
	getWorkTypeBreakdown,
	getWorkTypeOwnership,
} from "@/lib/activity/stats";
import { useActivity } from "@/lib/api/get-activity";
import { useYearContributions } from "@/lib/api/get-contributions";
import { useRepoStats } from "@/lib/api/get-repo-stats";
import { useRepositories } from "@/lib/api/get-repositories";
import { useAllTimeMergedPRs } from "@/lib/api/search";
import {
	aggregateLanguages,
	aggregateYearlySeries,
	classifyEcosystem,
	pickTopRepos,
} from "@/lib/repos/stats";
import { ActivityHighlights } from "./activity-highlights";
import { ContributionMatrix } from "./contribution-matrix";
import { LanguagesEcosystem } from "./languages-ecosystem";
import { OpenSourceReach, OpenSourceReachSkeleton } from "./open-source-reach";
import { WorkHabitGraph } from "./work-habit-graph";
import { WorkTypeRadar } from "./work-type-radar";
import { YearOverview } from "./year-overview";

function ActivitySkeleton({ isAuthed = true }: { isAuthed?: boolean }) {
	return (
		<div className="flex flex-col gap-6">
			<article className="flex flex-col gap-2">
				<Skeleton className="h-7 w-48" />
				<Skeleton className="h-5 w-72" />
				<Skeleton className="h-36 w-full" />
				<Skeleton className="h-4 w-64" />
			</article>
			<article className="flex flex-col gap-2">
				<Skeleton className="h-7 w-40" />
				<Skeleton className="h-80 w-full" />
				<Skeleton className="h-4 w-72" />
			</article>
			<article className="flex flex-col gap-2">
				<Skeleton className="h-7 w-36" />
				<div className="grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
				<Skeleton className="h-4 w-64" />
			</article>
			{isAuthed && (
				<article className="flex flex-col gap-2">
					<Skeleton className="h-7 w-64" />
					<Skeleton className="h-5 w-80" />
					<Skeleton className="h-36 w-full" />
				</article>
			)}
			{isAuthed && (
				<article className="flex flex-col gap-4">
					<Skeleton className="h-7 w-52" />
					<Skeleton className="h-5 w-64" />
					<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
						<Skeleton className="h-72 w-full" />
						<div className="flex flex-col gap-3">
							<Skeleton className="h-5 w-40" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
						</div>
					</div>
				</article>
			)}
			<article className="flex flex-col gap-2">
				<Skeleton className="h-7 w-56" />
				<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
					<div className="flex flex-col gap-2">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-4 w-56" />
						<Skeleton className="h-64 w-full" />
					</div>
					<div className="flex flex-col gap-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-64" />
						<Skeleton className="h-64 w-full" />
					</div>
				</div>
			</article>
			<article className="flex flex-col gap-2">
				<Skeleton className="h-7 w-44" />
				<OpenSourceReachSkeleton isAuthed={isAuthed} />
			</article>
		</div>
	);
}

export function Activity() {
	const { username } = useParams();
	const { token } = useSession();
	const isAuthed = Boolean(token);
	const {
		data: events,
		isLoading: eventsLoading,
		isError: eventsError,
		error: eventsFetchError,
	} = useActivity(username);
	const { data: repos, isLoading: reposLoading } = useRepositories(username);
	const topRepos = repos ? pickTopRepos(repos) : [];
	const { data: repoStats, isLoading: repoStatsLoading } = useRepoStats(
		topRepos.map((repo) => repo.full_name),
	);
	const repoSectionsLoading = reposLoading || repoStatsLoading;
	const { data: allTimePRsData, isLoading: allTimePRsQueryLoading } =
		useAllTimeMergedPRs(username);
	const { data: yearData } = useYearContributions(username);

	const allTimePRs = isAuthed ? allTimePRsData : undefined;
	const allTimePRsLoading = isAuthed ? allTimePRsQueryLoading : false;
	const visibleYearData = isAuthed ? yearData : undefined;
	const yearly = isAuthed ? (yearData?.ownership ?? null) : null;

	if (eventsLoading) return <ActivitySkeleton isAuthed={isAuthed} />;
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
	const workTypeOwnership = hasEvents
		? getWorkTypeOwnership(events, username ?? "")
		: [];
	const patterns = hasEvents ? getActivityPatterns(events) : null;
	const externalPRs = hasEvents
		? getExternalMergedPRs(events, username ?? "")
		: [];
	const weeklyOwnership = hasEvents
		? getWeeklyOwnership(events, username ?? "")
		: [];
	const matrix = visibleYearData
		? {
				total: visibleYearData.total,
				days: visibleYearData.days,
				start: visibleYearData.start,
				end: visibleYearData.end,
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
		(repoStats ?? []).map((stat) => stat?.participation?.all),
	);
	const yearlyTotal = yearlySeries.reduce((sum, count) => sum + count, 0);
	const languageShares = aggregateLanguages(
		(repoStats ?? []).map((stat) => stat?.languages),
	);
	const ecosystem = classifyEcosystem(topRepos);

	return (
		<div className="flex flex-col gap-6">
			<article className="flex flex-col gap-2">
				<h3 className="text-lg font-bold">Past year</h3>
				{repoSectionsLoading ? (
					<div className="flex flex-col gap-2">
						<Skeleton className="h-36 w-full" />
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-12" />
						</div>
					</div>
				) : yearlyTotal > 0 ? (
					<>
						<p className="text-sm text-dim">
							All commits to top repositories · past 52 weeks
						</p>
						<YearOverview series={yearlySeries} />
					</>
				) : (
					<p className="text-sm text-dim">
						No commits to these repositories in the past year.
					</p>
				)}
			</article>
			<article className="flex flex-col gap-2">
				<h3 className="text-lg font-bold">Work habits</h3>
				<WorkHabitGraph cells={getWorkHabitMatrix(events ?? [])} />
			</article>
			<article className="flex flex-col gap-2">
				<h3 className="text-lg font-bold">Highlights</h3>
				{patterns ? (
					<ActivityHighlights patterns={patterns} />
				) : (
					<p className="text-sm text-dim">No activity in this window.</p>
				)}
			</article>
			{isAuthed &&
				(matrix ? (
					<article className="flex flex-col gap-2">
						<h3 className="text-lg font-bold">
							{matrix.total} contributions
							{visibleYearData ? " in the past year" : ""}
						</h3>
						{matrix.start && matrix.end && (
							<p className="text-sm text-dim">
								{matrix.caption} · {matrix.start} – {matrix.end}
							</p>
						)}
						<ContributionMatrix days={matrix.days} />
					</article>
				) : (
					<article className="flex flex-col gap-2">
						<h3 className="text-lg font-bold">Contributions</h3>
						<p className="text-sm text-dim">
							No contributions found for this period.
						</p>
					</article>
				))}
			{isAuthed && (
				<article className="flex flex-col gap-2">
					<h3 className="text-lg font-bold">Breakdown of work type</h3>
					{hasEvents && breakdown ? (
						<WorkTypeRadar breakdown={breakdown} ownership={workTypeOwnership} />
					) : (
						<p className="text-sm text-dim">No activity in this window.</p>
					)}
				</article>
			)}
			<article className="flex flex-col gap-2">
				<h3 className="text-lg font-bold">Languages & ecosystem</h3>
				{repoSectionsLoading ? (
						<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
							<div className="flex flex-col gap-2">
								<Skeleton className="h-5 w-24" />
								<Skeleton className="h-4 w-56" />
								<Skeleton className="h-64 w-full" />
							</div>
							<div className="flex flex-col gap-2">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-4 w-64" />
								<Skeleton className="h-64 w-full" />
							</div>
						</div>
					) : languageShares.length > 0 ? (
						<LanguagesEcosystem shares={languageShares} ecosystem={ecosystem} />
					) : (
						<p className="text-sm text-dim">
							No language data for these repositories.
						</p>
					)}
			</article>
			<article className="flex flex-col gap-2">
				<h3 className="text-lg font-bold">Open source reach</h3>
				<OpenSourceReach
					recent={externalPRs}
					allTime={allTimePRs?.items ?? []}
					allTimeTotal={allTimePRs?.total ?? null}
					allTimeLoading={allTimePRsLoading}
					yearly={yearly}
					weekly={weeklyOwnership}
					isAuthed={isAuthed}
				/>
			</article>
		</div>
	);
}
