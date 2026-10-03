import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/skeleton";
import { useRepoStats } from "@/lib/api/get-repo-stats";
import { useRepositories } from "@/lib/api/get-repositories";
import { pickTopRepos } from "@/lib/repos/stats";

function RepositoriesSkeleton() {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
			<Skeleton className="h-32 w-full" />
			<Skeleton className="h-32 w-full" />
			<Skeleton className="h-32 w-full" />
		</div>
	);
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("default", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function Repositories() {
	const { username } = useParams();
	const { data: repos, isLoading, isError, error } = useRepositories(username);
	const topRepos = repos ? pickTopRepos(repos) : [];
	const { data: stats } = useRepoStats(topRepos.map((repo) => repo.full_name));
	const contributorsByRepo = new Map(
		(stats ?? []).flatMap((stat) =>
			stat ? [[stat.fullName, stat.contributors ?? []] as const] : [],
		),
	);

	if (isLoading) return <RepositoriesSkeleton />;
	if (isError) {
		return (
			<p className="text-sm font-medium text-red-500">
				🚫&nbsp;
				{error instanceof Error ? error.message : "Could not load repositories"}
			</p>
		);
	}
	if (!repos || topRepos.length === 0) {
		return (
			<p className="text-sm text-dim">
				No non-fork repositories found for{" "}
				<span className="font-medium">{username}</span>.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
				{topRepos.map((repo) => {
					const contributors =
						contributorsByRepo.get(repo.full_name)?.slice(0, 3) ?? [];
					return (
						<div
							key={repo.full_name}
							className="flex flex-col gap-2 rounded-lg border-2 border-stroke bg-background p-2 shadow"
						>
							<div className="flex items-center justify-between gap-2">
								<a
									href={repo.html_url}
									target="_blank"
									rel="noreferrer"
									className="truncate text-sm font-medium hover:underline"
								>
									{repo.name}
								</a>
								<p className="shrink-0 text-xs text-dim">
									⭐ {repo.stargazers_count} · 🍴 {repo.forks_count}
								</p>
							</div>
							<p className="line-clamp-2 min-h-10 text-sm text-dim">
								{repo.description ?? "No description"}
							</p>
							<div className="flex items-center justify-between gap-2">
								<p className="text-xs text-dim">
									{repo.language ?? "Unknown"} · pushed{" "}
									{formatDate(repo.pushed_at)}
								</p>
								{contributors.length > 0 && (
									<div className="flex shrink-0 -space-x-2">
										{contributors.map((contributor) => (
											<img
												key={contributor.login}
												src={contributor.avatar_url}
												alt={contributor.login || "Contributor"}
												title={contributor.login || "Contributor"}
												className="h-6 w-6 rounded-full border border-stroke bg-paper"
											/>
										))}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
			<p className="text-xs text-dim">
				Top {topRepos.length} by recent activity · forks excluded
			</p>
		</div>
	);
}
