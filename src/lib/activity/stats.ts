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
 *
 * GitHub sometimes omits push size info (no `distinct_size`, `size`, or
 * `commits`); a code push still represents at least one commit, so fall
 * back to 1 — except for new-ref pushes (zero `before`), which carry no
 * commits of their own.
 */
function eventWeight(event: GithubEvent): number {
	if (event.type === "PushEvent") {
		const size =
			event.payload.distinct_size ??
			event.payload.size ??
			event.payload.commits?.length ??
			0;
		if (size > 0) return size;
		if (event.payload.before && /^0+$/.test(event.payload.before)) return 0;
		return 1;
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

export interface BreakdownPoint {
	type: string;
	value: number;
	lifetime?: number;
}

/**
 * Every event in the window counts toward exactly one axis, using the
 * same weights as the heatmap (pushes count their commits, everything
 * else counts once). Axes with no activity are omitted.
 */
function classifyWorkType(event: GithubEvent): { type: string; value: number } {
	switch (event.type) {
		case "PushEvent":
			return { type: "Commits", value: eventWeight(event) };
		case "PullRequestEvent":
			return { type: "Pull requests", value: 1 };
		case "PullRequestReviewEvent":
			return { type: "Reviews", value: 1 };
		case "IssuesEvent":
			return { type: "Issues", value: 1 };
		case "IssueCommentEvent":
		case "PullRequestReviewCommentEvent":
			return { type: "Comments", value: 1 };
		case "ForkEvent":
			return { type: "Forks", value: 1 };
		case "CreateEvent":
		case "DeleteEvent":
			return { type: "Branches & tags", value: 1 };
		case "WatchEvent":
			return { type: "Stars", value: 1 };
		default:
			return { type: "Other activity", value: 1 };
	}
}

export const WORK_TYPE_ORDER = [
	"Commits",
	"Pull requests",
	"Reviews",
	"Issues",
	"Comments",
	"Forks",
	"Branches & tags",
	"Stars",
	"Other activity",
];

export function getWorkTypeBreakdown(events: GithubEvent[]): BreakdownPoint[] {
	const counts = new Map<string, number>();
	for (const event of events) {
		const { type, value } = classifyWorkType(event);
		counts.set(type, (counts.get(type) ?? 0) + value);
	}
	// All axes are always returned (zero included) so the radar keeps its
	// full shape instead of collapsing to only the active types.
	return WORK_TYPE_ORDER.map((type) => ({
		type,
		value: counts.get(type) ?? 0,
	}));
}

function isOwnRepo(event: GithubEvent, username: string): boolean {
	return (
		event.repo.name.split("/")[0].toLowerCase() === username.toLowerCase()
	);
}

export interface WorkTypeOwnership {
	type: string;
	own: number;
	external: number;
}

/**
 * Own vs external split per work type, using the same axes as the radar.
 * Only types with activity are returned; empty ones are omitted.
 */
export function getWorkTypeOwnership(
	events: GithubEvent[],
	username: string,
): WorkTypeOwnership[] {
	const counts = new Map<string, { own: number; external: number }>();
	for (const event of events) {
		const { type, value } = classifyWorkType(event);
		const bucket = counts.get(type) ?? { own: 0, external: 0 };
		if (isOwnRepo(event, username)) bucket.own += value;
		else bucket.external += value;
		counts.set(type, bucket);
	}
	return WORK_TYPE_ORDER.filter(
		(type) => (counts.get(type)?.own ?? 0) + (counts.get(type)?.external ?? 0) > 0,
	).map((type) => ({ type, ...(counts.get(type) ?? { own: 0, external: 0 }) }));
}

export interface WorkTypeMomentum {
	type: string;
	firstHalf: number;
	secondHalf: number;
	delta: number;
}

/**
 * Per-type momentum: activity in the second half of the event window vs
 * the first half, split at the time midpoint between oldest and newest
 * event. Positive delta means accelerating.
 */
export function getWorkTypeMomentum(events: GithubEvent[]): WorkTypeMomentum[] {
	if (events.length === 0) return [];
	const times = events.map((event) =>
		new Date(event.created_at).getTime(),
	);
	const midpoint = (Math.min(...times) + Math.max(...times)) / 2;
	const counts = new Map<string, { firstHalf: number; secondHalf: number }>();
	for (const event of events) {
		const { type, value } = classifyWorkType(event);
		const bucket = counts.get(type) ?? { firstHalf: 0, secondHalf: 0 };
		if (new Date(event.created_at).getTime() < midpoint) {
			bucket.firstHalf += value;
		} else {
			bucket.secondHalf += value;
		}
		counts.set(type, bucket);
	}
	return WORK_TYPE_ORDER.map((type) => {
		const bucket = counts.get(type) ?? { firstHalf: 0, secondHalf: 0 };
		return { type, ...bucket, delta: bucket.secondHalf - bucket.firstHalf };
	});
}

export interface WorkTypeSummary {
	archetype: string;
	topType: string;
	topPercent: number;
}

const WORK_TYPE_ARCHETYPES: Record<string, string> = {
	Commits: "Builder",
	"Pull requests": "Shipper",
	Reviews: "Reviewer",
	Issues: "Triager",
	Comments: "Collaborator",
	Forks: "Explorer",
	"Branches & tags": "Maintainer",
	Stars: "Curator",
	"Other activity": "All-rounder",
};

/**
 * Headline archetype from the dominant work type. A type holding at
 * least half of all window activity names the archetype; otherwise the
 * profile reads as balanced ("All-rounder").
 */
export function getWorkTypeSummary(
	breakdown: BreakdownPoint[],
): WorkTypeSummary | null {
	if (breakdown.length === 0) return null;
	const total = breakdown.reduce((sum, point) => sum + point.value, 0);
	if (total === 0) return null;
	const top = breakdown.reduce((best, point) =>
		point.value > best.value ? point : best,
	);
	const topPercent = Math.round((top.value / total) * 100);
	const archetype =
		topPercent >= 50
			? (WORK_TYPE_ARCHETYPES[top.type] ?? "All-rounder")
			: "All-rounder";
	return { archetype, topType: top.type, topPercent };
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

export function formatHour(hour: number): string {
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

export interface WorkHabitPoint {
	label: string;
	value: number;
}

export interface WorkHabitData {
	hourly: WorkHabitPoint[];
	daily: WorkHabitPoint[];
}

/** Raw hour-of-day and day-of-week distributions (viewer-local time). */
export function getWorkHabitData(events: GithubEvent[]): WorkHabitData {
	const hourCounts = new Array<number>(24).fill(0);
	const weekdayCounts = new Array<number>(7).fill(0);
	for (const event of events) {
		const at = new Date(event.created_at);
		hourCounts[at.getHours()] += 1;
		weekdayCounts[at.getDay()] += 1;
	}
	return {
		hourly: hourCounts.map((value, hour) => ({
			label: formatHour(hour),
			value,
		})),
		daily: WEEKDAYS.map((day, i) => ({
			label: day.slice(0, 3),
			value: weekdayCounts[i],
		})),
	};
}

export interface WorkHabitCell {
	day: string;
	hour: number;
	hourLabel: string;
	count: number;
}

/**
 * Full hour × weekday matrix (viewer-local time), including zero cells so
 * the grid layout stays stable. Powers the punchcard-style bubble chart.
 */
export function getWorkHabitMatrix(events: GithubEvent[]): WorkHabitCell[] {
	const counts = new Map<string, number>();
	for (const event of events) {
		const at = new Date(event.created_at);
		const key = `${at.getDay()}-${at.getHours()}`;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	const cells: WorkHabitCell[] = [];
	for (let day = 0; day < 7; day++) {
		for (let hour = 0; hour < 24; hour++) {
			cells.push({
				day: WEEKDAYS[day].slice(0, 3),
				hour,
				hourLabel: formatHour(hour),
				count: counts.get(`${day}-${hour}`) ?? 0,
			});
		}
	}
	return cells;
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
