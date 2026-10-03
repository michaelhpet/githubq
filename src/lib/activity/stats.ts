import type { GithubEvent } from "@/lib/api/get-activity";
import { formatDay } from "@/lib/format";

export interface ContributionDay {
	date: string;
	count: number;
}

export interface ContributionWindow {
	days: ContributionDay[];
	total: number;
	start: string | null;
	end: string | null;
}

function toDayKey(iso: string): string {
	return iso.slice(0, 10);
}

/**
 * Contribution weight of a single event. Pushes count their commits,
 * every other tracked event counts as one contribution.
 */
function eventWeight(event: GithubEvent): number {
	if (event.type === "PushEvent") {
		return event.payload.size ?? event.payload.commits?.length ?? 0;
	}
	return 1;
}

const COUNTED_TYPES = new Set([
	"PushEvent",
	"PullRequestEvent",
	"PullRequestReviewEvent",
	"PullRequestReviewCommentEvent",
	"IssuesEvent",
	"IssueCommentEvent",
	"CreateEvent",
	"ForkEvent",
]);

export function buildContributionWindow(
	events: GithubEvent[],
): ContributionWindow {
	const counts = new Map<string, number>();
	for (const event of events) {
		if (!COUNTED_TYPES.has(event.type)) continue;
		const day = toDayKey(event.created_at);
		counts.set(day, (counts.get(day) ?? 0) + eventWeight(event));
	}
	const days = [...counts.entries()]
		.map(([date, count]) => ({ date, count }))
		.sort((a, b) => (a.date < b.date ? -1 : 1));
	const total = days.reduce((sum, day) => sum + day.count, 0);
	return {
		days,
		total,
		start: days.length > 0 ? days[0].date : null,
		end: days.length > 0 ? days[days.length - 1].date : null,
	};
}

export interface WorkTypeBreakdown {
	commits: number;
	pullRequests: number;
	reviews: number;
	issues: number;
}

export function getWorkTypeBreakdown(events: GithubEvent[]): WorkTypeBreakdown {
	const breakdown: WorkTypeBreakdown = {
		commits: 0,
		pullRequests: 0,
		reviews: 0,
		issues: 0,
	};
	for (const event of events) {
		switch (event.type) {
			case "PushEvent":
				breakdown.commits += eventWeight(event);
				break;
			case "PullRequestEvent":
				if (event.payload.action === "opened") breakdown.pullRequests += 1;
				break;
			case "PullRequestReviewEvent":
			case "PullRequestReviewCommentEvent":
				breakdown.reviews += 1;
				break;
			case "IssuesEvent":
				if (event.payload.action === "opened") breakdown.issues += 1;
				break;
		}
	}
	return breakdown;
}

const WEEKDAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

export type WorkingStyle = "Night owl" | "Early bird" | "Steady pace";

export interface ActivityPatterns {
	busiestDay: string | null;
	peakHours: string | null;
	workingStyle: WorkingStyle;
	activeDays: number;
	longestStreak: number;
}

function formatHour(hour: number): string {
	const suffix = hour < 12 ? "AM" : "PM";
	const twelve = hour % 12 === 0 ? 12 : hour % 12;
	return `${twelve} ${suffix}`;
}

function isNightHour(hour: number): boolean {
	return hour >= 22 || hour <= 4;
}

function isMorningHour(hour: number): boolean {
	return hour >= 5 && hour <= 10;
}

export function getActivityPatterns(events: GithubEvent[]): ActivityPatterns {
	const weekdayCounts = new Array<number>(7).fill(0);
	const hourCounts = new Array<number>(24).fill(0);
	const daySet = new Set<number>();
	for (const event of events) {
		// Local time of the viewer, so "active hours" read naturally.
		const at = new Date(event.created_at);
		weekdayCounts[at.getDay()] += 1;
		hourCounts[at.getHours()] += 1;
		daySet.add(
			new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime(),
		);
	}
	const total = events.length;
	if (total === 0) {
		return {
			busiestDay: null,
			peakHours: null,
			workingStyle: "Steady pace",
			activeDays: 0,
			longestStreak: 0,
		};
	}
	const busiestDay =
		WEEKDAYS[weekdayCounts.indexOf(Math.max(...weekdayCounts))];

	let bestStart = 0;
	let bestCount = -1;
	for (let start = 0; start < 24; start++) {
		const count =
			hourCounts[start] +
			hourCounts[(start + 1) % 24] +
			hourCounts[(start + 2) % 24];
		if (count > bestCount) {
			bestCount = count;
			bestStart = start;
		}
	}
	const peakHours =
		bestCount > 0
			? `${formatHour(bestStart)} – ${formatHour((bestStart + 3) % 24)}`
			: null;

	const nightShare =
		hourCounts
			.filter((_, hour) => isNightHour(hour))
			.reduce((a, b) => a + b, 0) / total;
	const morningShare =
		hourCounts
			.filter((_, hour) => isMorningHour(hour))
			.reduce((a, b) => a + b, 0) / total;
	const workingStyle: WorkingStyle =
		nightShare >= 0.4
			? "Night owl"
			: morningShare >= 0.4
				? "Early bird"
				: "Steady pace";

	const activeDays = daySet.size;
	const sortedDays = [...daySet].sort((a, b) => a - b);
	let longestStreak = sortedDays.length > 0 ? 1 : 0;
	let run = longestStreak;
	for (let i = 1; i < sortedDays.length; i++) {
		if (sortedDays[i] - sortedDays[i - 1] === 24 * 60 * 60 * 1000) {
			run += 1;
			longestStreak = Math.max(longestStreak, run);
		} else {
			run = 1;
		}
	}
	return {
		busiestDay,
		peakHours,
		workingStyle,
		activeDays,
		longestStreak,
	};
}

export interface WeeklyOwnership {
	week: string;
	own: number;
	external: number;
}

/**
 * Own vs external event counts per trailing week (Sunday-start UTC,
 * matching the heatmap). Covers the events window, not the full year.
 */
export function getWeeklyOwnership(
	events: GithubEvent[],
	username: string,
	weekCount = 8,
): WeeklyOwnership[] {
	const owner = username.toLowerCase();
	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);
	const thisSunday = today.getTime() - today.getUTCDay() * 24 * 60 * 60 * 1000;
	const buckets = new Map<string, { own: number; external: number }>();
	for (let i = 0; i < weekCount; i++) {
		const start = new Date(
			thisSunday - (weekCount - 1 - i) * 7 * 24 * 60 * 60 * 1000,
		);
		buckets.set(start.toISOString().slice(0, 10), { own: 0, external: 0 });
	}
	for (const event of events) {
		const at = new Date(event.created_at);
		const sunday = new Date(
			Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()) -
				at.getUTCDay() * 24 * 60 * 60 * 1000,
		);
		const bucket = buckets.get(sunday.toISOString().slice(0, 10));
		if (!bucket) continue;
		if (event.repo.name.split("/")[0].toLowerCase() === owner) bucket.own += 1;
		else bucket.external += 1;
	}
	return [...buckets.entries()].map(([start, counts]) => ({
		week: formatDay(start),
		...counts,
	}));
}

export interface ExternalPullRequest {
	repo: string;
	title: string;
	number: number;
	url: string;
	mergedAt: string;
}

export function getExternalMergedPRs(
	events: GithubEvent[],
	username: string,
): ExternalPullRequest[] {
	const owner = username.toLowerCase();
	return events
		.filter(
			(event) =>
				event.type === "PullRequestEvent" &&
				event.payload.action === "closed" &&
				event.payload.pull_request?.merged === true &&
				event.repo.name.split("/")[0].toLowerCase() !== owner,
		)
		.map((event) => {
			const pr = event.payload.pull_request;
			return {
				repo: event.repo.name,
				title: pr?.title ?? "Untitled",
				number: pr?.number ?? 0,
				url: pr?.html_url ?? `https://github.com/${event.repo.name}`,
				mergedAt: pr?.merged_at ?? event.created_at,
			};
		});
}
