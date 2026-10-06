import { IconGitFork, IconStar } from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/skeleton";
import { useRepoStats } from "@/lib/api/get-repo-stats";
import { useRepositories } from "@/lib/api/get-repositories";
import { pickTopRepos } from "@/lib/repos/stats";

const compactCount = new Intl.NumberFormat("default", { notation: "compact" });

function RepositoriesSkeleton() {
	return (
		<div className="flex flex-col gap-2">
			<div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-3">
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-28 w-full" />
			</div>
			<Skeleton className="h-4 w-64" />
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
	if (isError && !repos) {
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
			<div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-3">
				{topRepos.map((repo) => {
					const contributors =
						contributorsByRepo.get(repo.full_name)?.slice(0, 3) ?? [];
					return (
						<div
							key={repo.full_name}
							className="flex flex-col gap-2 rounded-lg border border-stroke bg-background p-2"
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
								{(repo.stargazers_count > 0 || repo.forks_count > 0) && (
									<p className="flex shrink-0 items-center gap-1 text-xs text-dim">
										{repo.stargazers_count > 0 && (
											<span className="flex items-center gap-0.5">
												<IconStar size={14} aria-hidden="true" />
												{compactCount.format(repo.stargazers_count)}
											</span>
										)}
										{repo.forks_count > 0 && (
											<span className="flex items-center gap-0.5">
												<IconGitFork size={14} aria-hidden="true" />
												{compactCount.format(repo.forks_count)}
											</span>
										)}
									</p>
								)}
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
												key={contributor.id || contributor.login}
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
