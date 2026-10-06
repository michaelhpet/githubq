import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { githubFetch, throwForStatus } from "./client";

export const LIFETIME_COUNTS_QUERY_KEY = "lifetime-counts";
export const ALL_TIME_PRS_QUERY_KEY = "all-time-prs";

export interface LifetimeCounts {
	commits: number;
	pullRequests: number;
	mergedPullRequests: number;
	reviews: number;
	issues: number;
}

async function searchTotalCount(
	kind: "commits" | "issues",
	query: string,
	token?: string | null,
): Promise<number> {
	const res = await githubFetch(
		`/search/${kind}?q=${encodeURIComponent(query)}&per_page=1`,
		token,
	);
	throwForStatus(res, "GitHub search");
	const body = (await res.json()) as { total_count: number };
	return body.total_count;
}

export async function getLifetimeCounts(
	username: string,
	token?: string | null,
): Promise<LifetimeCounts> {
	const commits = await searchTotalCount(
		"commits",
		`author:${username}`,
		token,
	);
	const pullRequests = await searchTotalCount(
		"issues",
		`author:${username} type:pr`,
		token,
	);
	const mergedPullRequests = await searchTotalCount(
		"issues",
		`author:${username} type:pr is:merged`,
		token,
	);
	const reviews = await searchTotalCount(
		"issues",
		`reviewed-by:${username} type:pr`,
		token,
	);
	const issues = await searchTotalCount(
		"issues",
		`author:${username} type:issue`,
		token,
	);
	return { commits, pullRequests, mergedPullRequests, reviews, issues };
}

export function useLifetimeCounts(username: string | undefined) {
	const { token } = useSession();
	return useQuery({
		queryKey: [LIFETIME_COUNTS_QUERY_KEY, username, token ? "authed" : "anon"],
		queryFn: () => getLifetimeCounts(username as string, token),
		enabled: Boolean(username && token),
	});
}

export interface AllTimePullRequest {
	repo: string;
	title: string;
	number: number;
	url: string;
	mergedAt: string;
}

interface IssueSearchItem {
	title: string;
	number: number;
	html_url: string;
	repository_url: string;
	closed_at: string | null;
	pull_request?: { merged_at: string | null };
}

function repoFromUrl(repositoryUrl: string): string {
	return repositoryUrl.split("/repos/")[1] ?? repositoryUrl;
}

export async function getAllTimeMergedPRs(
	username: string,
	limit = 10,
	token?: string | null,
): Promise<{ total: number; items: AllTimePullRequest[] }> {
	const res = await githubFetch(
		`/search/issues?q=${encodeURIComponent(`author:${username} type:pr is:merged`)}&per_page=${limit}&sort=updated&order=desc`,
		token,
	);
	throwForStatus(res, "pull request search");
	const body = (await res.json()) as {
		total_count: number;
		items: IssueSearchItem[];
	};
	const owner = username.toLowerCase();
	const items = body.items
		.filter(
			(item) =>
				repoFromUrl(item.repository_url).split("/")[0].toLowerCase() !== owner,
		)
		.map((item) => ({
			repo: repoFromUrl(item.repository_url),
			title: item.title,
			number: item.number,
			url: item.html_url,
			mergedAt: item.pull_request?.merged_at ?? item.closed_at ?? "",
		}));
	return { total: body.total_count, items };
}

export function useAllTimeMergedPRs(username: string | undefined) {
	const { token } = useSession();
	return useQuery({
		queryKey: [ALL_TIME_PRS_QUERY_KEY, username, token ? "authed" : "anon"],
		queryFn: () => getAllTimeMergedPRs(username as string, 10, token),
		enabled: Boolean(username && token),
	});
}
