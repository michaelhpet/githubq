import { useQuery } from "@tanstack/react-query";

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
): Promise<number> {
	const res = await fetch(
		`https://api.github.com/search/${kind}?q=${encodeURIComponent(query)}&per_page=1`,
		{
			headers: {
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
			},
		},
	);
	if (res.status === 403) {
		const reset = res.headers.get("x-ratelimit-reset");
		const when = reset
			? ` (resets at ${new Date(Number(reset) * 1000).toLocaleTimeString()})`
			: "";
		throw new Error(`GitHub API rate limit exceeded${when}`);
	}
	if (!res.ok) {
		throw new Error(`Could not search GitHub (${res.status})`);
	}
	const body = (await res.json()) as { total_count: number };
	return body.total_count;
}

export async function getLifetimeCounts(
	username: string,
): Promise<LifetimeCounts> {
	const commits = await searchTotalCount("commits", `author:${username}`);
	const pullRequests = await searchTotalCount(
		"issues",
		`author:${username} type:pr`,
	);
	const mergedPullRequests = await searchTotalCount(
		"issues",
		`author:${username} type:pr is:merged`,
	);
	const reviews = await searchTotalCount(
		"issues",
		`reviewed-by:${username} type:pr`,
	);
	const issues = await searchTotalCount(
		"issues",
		`author:${username} type:issue`,
	);
	return { commits, pullRequests, mergedPullRequests, reviews, issues };
}

export function useLifetimeCounts(username: string | undefined) {
	return useQuery({
		queryKey: [LIFETIME_COUNTS_QUERY_KEY, username],
		queryFn: () => getLifetimeCounts(username as string),
		enabled: Boolean(username),
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
): Promise<{ total: number; items: AllTimePullRequest[] }> {
	const res = await fetch(
		`https://api.github.com/search/issues?q=${encodeURIComponent(`author:${username} type:pr is:merged`)}&per_page=${limit}&sort=updated&order=desc`,
		{ headers: { Accept: "application/vnd.github+json" } },
	);
	if (res.status === 403) {
		const reset = res.headers.get("x-ratelimit-reset");
		const when = reset
			? ` (resets at ${new Date(Number(reset) * 1000).toLocaleTimeString()})`
			: "";
		throw new Error(`GitHub API rate limit exceeded${when}`);
	}
	if (!res.ok) {
		throw new Error(`Could not search pull requests (${res.status})`);
	}
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
	return useQuery({
		queryKey: [ALL_TIME_PRS_QUERY_KEY, username],
		queryFn: () => getAllTimeMergedPRs(username as string),
		enabled: Boolean(username),
	});
}
