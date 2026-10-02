import type { RepoContributor, RepoLanguages } from "@/lib/api/get-repo-stats";
import type { GithubRepo } from "@/lib/api/get-repositories";

/** How many top repos to analyse in depth (or fewer when N < 10). */
export const TOP_REPO_COUNT = 10;

/**
 * Top repos by push recency blended with stars. Forks are excluded —
 * they duplicate upstream work rather than representing the user's own.
 */
export function pickTopRepos(repos: GithubRepo[]): GithubRepo[] {
	return repos
		.filter((repo) => !repo.fork)
		.map((repo) => ({
			repo,
			pushedAt: new Date(repo.pushed_at).getTime() || 0,
			stars: repo.stargazers_count,
		}))
		.sort((a, b) => {
			if (a.pushedAt !== b.pushedAt) return b.pushedAt - a.pushedAt;
			return b.stars - a.stars;
		})
		.slice(0, TOP_REPO_COUNT)
		.map((entry) => entry.repo);
}

export interface LanguageShare {
	language: string;
	bytes: number;
	percent: number;
}

export function aggregateLanguages(
	allLanguages: (RepoLanguages | null | undefined)[],
): LanguageShare[] {
	const totals = new Map<string, number>();
	for (const languages of allLanguages) {
		if (!languages) continue;
		for (const [language, bytes] of Object.entries(languages)) {
			totals.set(language, (totals.get(language) ?? 0) + bytes);
		}
	}
	const grandTotal = [...totals.values()].reduce((a, b) => a + b, 0);
	if (grandTotal === 0) return [];
	return [...totals.entries()]
		.map(([language, bytes]) => ({
			language,
			bytes,
			percent: (bytes / grandTotal) * 100,
		}))
		.sort((a, b) => b.bytes - a.bytes);
}

/**
 * Element-wise sum of weekly owner-commit series across repos
 * (52 entries each, oldest first). Missing weeks count as zero.
 */
export function aggregateYearlySeries(
	series: (number[] | null | undefined)[],
): number[] {
	const totals = new Array<number>(52).fill(0);
	for (const weeks of series) {
		if (!weeks) continue;
		const offset = 52 - weeks.length;
		weeks.forEach((count, i) => {
			const at = offset + i;
			if (at >= 0) totals[at] += count;
		});
	}
	return totals;
}

export function topCollaborators(
	allContributors: (RepoContributor[] | null | undefined)[],
	username: string,
): RepoContributor[] {
	const seen = new Map<string, RepoContributor>();
	for (const contributors of allContributors) {
		if (!contributors) continue;
		for (const contributor of contributors) {
			if (!contributor.login) continue;
			if (contributor.login.toLowerCase() === username.toLowerCase()) continue;
			const existing = seen.get(contributor.login);
			if (!existing || contributor.contributions > existing.contributions) {
				seen.set(contributor.login, contributor);
			}
		}
	}
	return [...seen.values()]
		.sort((a, b) => b.contributions - a.contributions)
		.slice(0, 5);
}
