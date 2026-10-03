import { useQuery } from "@tanstack/react-query";
import type { ContributionDay } from "@/lib/activity/stats";
import { useSession } from "@/lib/auth/session";
import { GitHubApiError } from "./client";

export const YEAR_CONTRIBUTIONS_QUERY_KEY = "year-contributions";

export interface YearContributions {
	days: ContributionDay[];
	total: number;
	start: string | null;
	end: string | null;
	ownership: YearOwnership[];
}

export interface YearOwnership {
	type: string;
	own: number;
	external: number;
}

interface CalendarDay {
	date: string;
	contributionCount: number;
	weekday: number;
}

const CALENDAR_QUERY = `
	query ($login: String!) {
		user(login: $login) {
			contributionsCollection {
				contributionCalendar {
					totalContributions
					weeks {
						contributionDays {
							date
							contributionCount
							weekday
						}
					}
				}
				commitContributionsByRepository {
					contributions { totalCount }
					repository { nameWithOwner }
				}
				pullRequestContributionsByRepository {
					contributions { totalCount }
					repository { nameWithOwner }
				}
				issueContributionsByRepository {
					contributions { totalCount }
					repository { nameWithOwner }
				}
				pullRequestReviewContributionsByRepository {
					contributions { totalCount }
					repository { nameWithOwner }
				}
			}
		}
	}
`;

interface RepoContributionEntry {
	contributions?: { totalCount?: number } | null;
	repository?: { nameWithOwner?: string } | null;
}

function splitOwnership(
	entries: RepoContributionEntry[] | undefined,
	username: string,
): { own: number; external: number } {
	let own = 0;
	let external = 0;
	for (const entry of entries ?? []) {
		const count = entry.contributions?.totalCount ?? 0;
		const repoOwner = (entry.repository?.nameWithOwner ?? "/").split("/")[0];
		if (repoOwner.toLowerCase() === username.toLowerCase()) own += count;
		else external += count;
	}
	return { own, external };
}

export async function getYearContributions(
	username: string,
	token: string,
): Promise<YearContributions> {
	const res = await fetch("https://api.github.com/graphql", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			query: CALENDAR_QUERY,
			variables: { login: username },
		}),
	});
	if (!res.ok) {
		throw new GitHubApiError(
			`Could not fetch yearly contributions for "${username}" (${res.status})`,
			res.status,
		);
	}
	const body = (await res.json()) as {
		data?: {
			user?: {
				contributionsCollection?: {
					contributionCalendar?: {
						totalContributions?: number;
						weeks?: { contributionDays?: CalendarDay[] }[];
					};
					commitContributionsByRepository?: RepoContributionEntry[];
					pullRequestContributionsByRepository?: RepoContributionEntry[];
					issueContributionsByRepository?: RepoContributionEntry[];
					pullRequestReviewContributionsByRepository?: RepoContributionEntry[];
				};
			};
		};
		errors?: { message?: string }[];
	};
	if (body.errors?.length) {
		throw new GitHubApiError(
			body.errors[0]?.message ?? "Could not fetch yearly contributions",
			res.status,
		);
	}
	const collection = body.data?.user?.contributionsCollection;
	const calendar = collection?.contributionCalendar;
	const days = (calendar?.weeks ?? []).flatMap(
		(week) => week.contributionDays ?? [],
	);
	const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1));
	const ownershipTypes = [
		{ type: "Commits", entries: collection?.commitContributionsByRepository },
		{
			type: "Pull requests",
			entries: collection?.pullRequestContributionsByRepository,
		},
		{
			type: "Reviews",
			entries: collection?.pullRequestReviewContributionsByRepository,
		},
		{ type: "Issues", entries: collection?.issueContributionsByRepository },
	];
	return {
		days: sorted.map((day) => ({
			date: day.date,
			count: day.contributionCount,
		})),
		total:
			calendar?.totalContributions ??
			sorted.reduce((sum, day) => sum + day.contributionCount, 0),
		start: sorted.length > 0 ? sorted[0].date : null,
		end: sorted.length > 0 ? sorted[sorted.length - 1].date : null,
		ownership: ownershipTypes.map(({ type, entries }) => ({
			type,
			...splitOwnership(entries, username),
		})),
	};
}

export function useYearContributions(username: string | undefined) {
	const { token } = useSession();
	return useQuery({
		queryKey: [YEAR_CONTRIBUTIONS_QUERY_KEY, username],
		queryFn: () => getYearContributions(username as string, token as string),
		enabled: Boolean(username && token),
	});
}
