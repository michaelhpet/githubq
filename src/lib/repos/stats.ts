import type { RepoContributor, RepoLanguages } from "@/lib/api/get-repo-stats";
import type { GithubRepo } from "@/lib/api/get-repositories";

export const TOP_REPO_COUNT = 10;

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

export interface LanguageInsights {
	primary: { language: string; percent: number } | null;
	count: number;
	mostStarred: { language: string; stars: number } | null;
	mostRecent: { language: string; pushedAt: string } | null;
}

export function getLanguageInsights(
	repos: GithubRepo[],
	shares: LanguageShare[],
): LanguageInsights {
	const stars = new Map<string, number>();
	const pushed = new Map<string, string>();
	for (const repo of repos) {
		if (!repo.language) continue;
		stars.set(
			repo.language,
			(stars.get(repo.language) ?? 0) + repo.stargazers_count,
		);
		if (
			!pushed.has(repo.language) ||
			repo.pushed_at > (pushed.get(repo.language) as string)
		) {
			pushed.set(repo.language, repo.pushed_at);
		}
	}
	let mostStarred: LanguageInsights["mostStarred"] = null;
	for (const [language, starCount] of stars) {
		if (!mostStarred || starCount > mostStarred.stars) {
			mostStarred = { language, stars: starCount };
		}
	}
	let mostRecent: LanguageInsights["mostRecent"] = null;
	for (const [language, pushedAt] of pushed) {
		if (!mostRecent || pushedAt > mostRecent.pushedAt) {
			mostRecent = { language, pushedAt };
		}
	}
	return {
		primary: shares[0]
			? { language: shares[0].language, percent: shares[0].percent }
			: null,
		count: shares.length,
		mostStarred,
		mostRecent,
	};
}

export interface EcosystemSlice {
	subject: string;
	value: number;
}

const FRONTEND_TOPICS = new Set([
	"react",
	"vue",
	"angular",
	"svelte",
	"nextjs",
	"nuxt",
	"gatsby",
	"remix",
	"tailwind",
	"tailwindcss",
	"css",
	"sass",
	"scss",
	"frontend",
	"typescript",
	"javascript",
	"html",
	"ui",
	"design-system",
	"web",
	"spa",
	"pwa",
	"vite",
]);

const BACKEND_TOPICS = new Set([
	"node",
	"nodejs",
	"express",
	"fastify",
	"django",
	"flask",
	"fastapi",
	"rails",
	"laravel",
	"spring",
	"api",
	"rest",
	"graphql",
	"backend",
	"server",
	"database",
	"postgres",
	"postgresql",
	"mysql",
	"sqlite",
	"mongodb",
	"redis",
	"microservices",
]);

const DEVOPS_TOPICS = new Set([
	"docker",
	"kubernetes",
	"k8s",
	"terraform",
	"ansible",
	"ci",
	"cd",
	"cicd",
	"github-actions",
	"devops",
	"monitoring",
	"observability",
	"prometheus",
	"grafana",
	"infrastructure",
	"iac",
	"helm",
	"deployment",
	"cloud",
	"aws",
	"gcp",
	"azure",
	"nginx",
	"sre",
]);

const SYSTEMS_TOPICS = new Set([
	"rust",
	"c",
	"cpp",
	"c++",
	"zig",
	"kernel",
	"linux",
	"embedded",
	"firmware",
	"operating-system",
	"compiler",
	"wasm",
	"webassembly",
	"networking",
]);

const LANGUAGE_ECOSYSTEM: Record<string, string> = {
	TypeScript: "Frontend",
	JavaScript: "Frontend",
	CSS: "Frontend",
	HTML: "Frontend",
	Vue: "Frontend",
	Svelte: "Frontend",
	Python: "Backend",
	Ruby: "Backend",
	PHP: "Backend",
	Java: "Backend",
	Kotlin: "Backend",
	Go: "Backend",
	"C#": "Backend",
	Scala: "Backend",
	Elixir: "Backend",
	Rust: "Systems",
	C: "Systems",
	"C++": "Systems",
	Zig: "Systems",
	Haskell: "Systems",
	Shell: "DevOps",
	Dockerfile: "DevOps",
	HCL: "DevOps",
};

const ECOSYSTEM_SUBJECTS = ["Frontend", "Backend", "DevOps", "Systems"];

export function classifyEcosystem(repos: GithubRepo[]): EcosystemSlice[] {
	const counts: Record<string, number> = {
		Frontend: 0,
		Backend: 0,
		DevOps: 0,
		Systems: 0,
	};
	for (const repo of repos) {
		const matched = new Set<string>();
		for (const topic of repo.topics ?? []) {
			const normalized = topic.toLowerCase();
			if (FRONTEND_TOPICS.has(normalized)) matched.add("Frontend");
			if (BACKEND_TOPICS.has(normalized)) matched.add("Backend");
			if (DEVOPS_TOPICS.has(normalized)) matched.add("DevOps");
			if (SYSTEMS_TOPICS.has(normalized)) matched.add("Systems");
		}
		if (matched.size === 0 && repo.language) {
			const bucket = LANGUAGE_ECOSYSTEM[repo.language];
			if (bucket) matched.add(bucket);
		}
		for (const bucket of matched) counts[bucket] += 1;
	}
	return ECOSYSTEM_SUBJECTS.map((subject) => ({
		subject,
		value: counts[subject],
	}));
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
