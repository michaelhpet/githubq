import { useQuery } from "@tanstack/react-query";

export const REPOSITORIES_QUERY_KEY = "repositories";

/** Cap repo listing pages (100 repos/page). */
const MAX_PAGES = 3;

export interface GithubRepo {
	name: string;
	full_name: string;
	description: string | null;
	stargazers_count: number;
	forks_count: number;
	language: string | null;
	fork: boolean;
	pushed_at: string;
	open_issues_count: number;
	html_url: string;
	owner: { login: string };
}

export async function getUserRepos(username: string): Promise<GithubRepo[]> {
	const repos: GithubRepo[] = [];
	for (let page = 1; page <= MAX_PAGES; page++) {
		const res = await fetch(
			`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=pushed`,
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
			throw new Error(
				`Could not fetch repositories for "${username}" (${res.status})`,
			);
		}
		const pageRepos = (await res.json()) as GithubRepo[];
		repos.push(...pageRepos);
		if (pageRepos.length < 100) break;
	}
	return repos;
}

export function useRepositories(username: string | undefined) {
	return useQuery({
		queryKey: [REPOSITORIES_QUERY_KEY, username],
		queryFn: () => getUserRepos(username as string),
		enabled: Boolean(username),
	});
}
