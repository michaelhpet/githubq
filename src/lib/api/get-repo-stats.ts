import { useQueries } from "@tanstack/react-query";

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

async function fetchRepo<T>(fullName: string, path: string): Promise<T | null> {
	const res = await fetch(`https://api.github.com/repos/${fullName}/${path}`, {
		headers: { Accept: "application/vnd.github+json" },
	});
	// GitHub returns 202 while crunching stats, or 204/404 when unavailable.
	if (res.status === 202 || res.status === 204 || res.status === 404) {
		return null;
	}
	if (!res.ok) {
		throw new Error(
			`Could not fetch ${path} for "${fullName}" (${res.status})`,
		);
	}
	return (await res.json()) as T;
}

export function getRepoLanguages(
	fullName: string,
): Promise<RepoLanguages | null> {
	return fetchRepo<RepoLanguages>(fullName, "languages");
}

export function getRepoParticipation(
	fullName: string,
): Promise<RepoParticipation | null> {
	return fetchRepo<RepoParticipation>(fullName, "stats/participation");
}

export function getRepoContributors(
	fullName: string,
): Promise<RepoContributor[] | null> {
	return fetchRepo<RepoContributor[]>(
		fullName,
		"contributors?per_page=5&anon=1",
	);
}

export interface RepoStats {
	fullName: string;
	languages: RepoLanguages | null;
	participation: RepoParticipation | null;
	contributors: RepoContributor[] | null;
}

export function useRepoStats(fullNames: string[]) {
	const results = useQueries({
		queries: fullNames.map((fullName) => ({
			queryKey: [REPO_LANGUAGES_QUERY_KEY, fullName],
			queryFn: async (): Promise<RepoStats> => {
				const [languages, participation, contributors] = await Promise.all([
					getRepoLanguages(fullName),
					getRepoParticipation(fullName),
					getRepoContributors(fullName),
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
