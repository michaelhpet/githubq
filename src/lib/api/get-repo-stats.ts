import { useQueries } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { githubFetch, throwForStatus } from "./client";

export const REPO_LANGUAGES_QUERY_KEY = "repo-languages";
export const REPO_PARTICIPATION_QUERY_KEY = "repo-participation";
export const REPO_CONTRIBUTORS_QUERY_KEY = "repo-contributors";

export type RepoLanguages = Record<string, number>;

export interface RepoParticipation {
	all: number[];
	owner: number[];
}

export interface RepoContributor {
	login: string;
	avatar_url: string;
	contributions: number;
}

async function fetchRepo<T>(
	fullName: string,
	path: string,
	token?: string | null,
): Promise<T | null> {
	const res = await githubFetch(`/repos/${fullName}/${path}`, token);
	// GitHub returns 202 while crunching stats, or 204/404 when unavailable.
	if (res.status === 202 || res.status === 204 || res.status === 404) {
		return null;
	}
	throwForStatus(res, `${path} for "${fullName}"`);
	return (await res.json()) as T;
}

export function getRepoLanguages(
	fullName: string,
	token?: string | null,
): Promise<RepoLanguages | null> {
	return fetchRepo<RepoLanguages>(fullName, "languages", token);
}

export function getRepoParticipation(
	fullName: string,
	token?: string | null,
): Promise<RepoParticipation | null> {
	return fetchRepo<RepoParticipation>(fullName, "stats/participation", token);
}

export function getRepoContributors(
	fullName: string,
	token?: string | null,
): Promise<RepoContributor[] | null> {
	return fetchRepo<RepoContributor[]>(
		fullName,
		"contributors?per_page=5&anon=1",
		token,
	);
}

export interface RepoStats {
	fullName: string;
	languages: RepoLanguages | null;
	participation: RepoParticipation | null;
	contributors: RepoContributor[] | null;
}

export function useRepoStats(fullNames: string[]) {
	const { token } = useSession();
	const authed = token ? "authed" : "anon";
	const results = useQueries({
		queries: fullNames.map((fullName) => ({
			queryKey: [REPO_LANGUAGES_QUERY_KEY, fullName, authed],
			queryFn: async (): Promise<RepoStats> => {
				const [languages, participation, contributors] = await Promise.all([
					getRepoLanguages(fullName, token),
					getRepoParticipation(fullName, token),
					getRepoContributors(fullName, token),
				]);
				return { fullName, languages, participation, contributors };
			},
		})),
	});
	return {
		data: results.map((result) => result.data),
		isLoading: results.some((result) => result.isLoading),
		isError: results.some((result) => result.isError),
	};
}
