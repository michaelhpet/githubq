import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { githubFetch, throwForStatus } from "./client";

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

export async function getUserRepos(
	username: string,
	token?: string | null,
): Promise<GithubRepo[]> {
	const repos: GithubRepo[] = [];
	for (let page = 1; page <= MAX_PAGES; page++) {
		const res = await githubFetch(
			`/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=pushed`,
			token,
		);
		throwForStatus(res, `repositories for "${username}"`);
		const pageRepos = (await res.json()) as GithubRepo[];
		repos.push(...pageRepos);
		if (pageRepos.length < 100) break;
	}
	return repos;
}

export function useRepositories(username: string | undefined) {
	const { token } = useSession();
	return useQuery({
		queryKey: [REPOSITORIES_QUERY_KEY, username, token ? "authed" : "anon"],
		queryFn: () => getUserRepos(username as string, token),
		enabled: Boolean(username),
	});
}
