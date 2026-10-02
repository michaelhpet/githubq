import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/skeleton";
import { useRepoStats } from "@/lib/api/get-repo-stats";
import { useRepositories } from "@/lib/api/get-repositories";
import { aggregateLanguages, pickTopRepos } from "@/lib/repos/stats";

export function Languages() {
	const { username } = useParams();
	const { data: repos, isLoading, isError, error } = useRepositories(username);
	const topRepos = repos ? pickTopRepos(repos) : [];
	const { data: stats, isLoading: statsLoading } = useRepoStats(
		topRepos.map((repo) => repo.full_name),
	);
	const shares = aggregateLanguages(
		(stats ?? []).map((stat) => stat?.languages),
	);

	if (isLoading || statsLoading) {
		return (
			<div className="flex flex-col gap-3">
				<Skeleton className="h-8 w-full" />
				<Skeleton className="h-8 w-full" />
				<Skeleton className="h-8 w-full" />
			</div>
		);
	}
	if (isError) {
		return (
			<p className="text-sm font-medium text-red-500">
				🚫&nbsp;
				{error instanceof Error ? error.message : "Could not load languages"}
			</p>
		);
	}
	if (shares.length === 0) {
		return (
			<p className="text-sm text-dim">
				No language data found for{" "}
				<span className="font-medium">{username}</span>.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col gap-3">
				{shares.slice(0, 8).map((share) => (
					<div key={share.language} className="flex flex-col gap-1">
						<div className="flex items-center justify-between gap-2 text-sm">
							<span className="font-medium">{share.language}</span>
							<span className="text-dim">{share.percent.toFixed(1)}%</span>
						</div>
						<div className="h-2 overflow-hidden rounded bg-paper">
							<div
								className="h-2 rounded bg-accent"
								style={{ width: `${share.percent}%` }}
							/>
						</div>
					</div>
				))}
			</div>
			<p className="text-xs text-dim">
				By bytes across top {topRepos.length} repositor
				{topRepos.length === 1 ? "y" : "ies"}
			</p>
		</div>
	);
}
