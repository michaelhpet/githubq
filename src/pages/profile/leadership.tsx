import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/skeleton";
import type { RepoMaintenance } from "@/lib/api/get-maintenance";
import { useMaintenance } from "@/lib/api/get-maintenance";
import { useRepositories } from "@/lib/api/get-repositories";
import { pickTopRepos } from "@/lib/repos/stats";

const MAINTAINED_COUNT = 5;
const DETAILED_README_BYTES = 1024;

function mean(values: (number | null | undefined)[]): number | null {
	const defined = values.filter(
		(value): value is number => typeof value === "number",
	);
	if (defined.length === 0) return null;
	return defined.reduce((sum, value) => sum + value, 0) / defined.length;
}

function formatDays(days: number | null): string {
	if (days === null) return "—";
	return `${days < 10 ? days.toFixed(1) : Math.round(days)} day${days === 1 ? "" : "s"}`;
}

function formatDate(iso: string | null): string {
	if (!iso) return "undated";
	return new Date(iso).toLocaleDateString("default", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-1 rounded-lg border border-stroke bg-background p-3">
			<p className="text-sm text-dim">{label}</p>
			<p className="text-xl font-bold">{value}</p>
		</div>
	);
}

function LeadershipSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<article className="flex flex-col gap-2">
				<Skeleton className="h-7 w-36" />
				<div className="grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
				<Skeleton className="h-4 w-64" />
			</article>
			<article className="flex flex-col gap-2">
				<Skeleton className="h-7 w-56" />
				<div className="grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			</article>
			<article className="flex flex-col gap-2">
				<Skeleton className="h-7 w-44" />
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-16 w-full" />
			</article>
		</div>
	);
}

export function Leadership() {
	const { username } = useParams();
	const { data: repos, isLoading, isError, error } = useRepositories(username);
	const maintained = repos
		? pickTopRepos(repos).slice(0, MAINTAINED_COUNT)
		: [];
	const { data: maintenance, isLoading: maintenanceLoading } = useMaintenance(
		maintained.map((repo) => repo.full_name),
	);
	const stats = (maintenance ?? []).filter((stat): stat is RepoMaintenance =>
		Boolean(stat),
	);

	if (isLoading || maintenanceLoading) return <LeadershipSkeleton />;
	// A failed background refresh must not wipe out cached data.
	if (isError && !repos) {
		return (
			<p className="text-sm font-medium text-red-500">
				🚫&nbsp;
				{error instanceof Error ? error.message : "Could not load leadership"}
			</p>
		);
	}
	if (maintained.length === 0) {
		return (
			<p className="text-sm text-dim">
				No maintained repositories found for{" "}
				<span className="font-medium">{username}</span>.
			</p>
		);
	}

	const avgIssueClose = mean(stats.map((stat) => stat.avgIssueCloseDays));
	const avgPRClose = mean(stats.map((stat) => stat.avgPRCloseDays));
	const closedSample = stats.reduce(
		(sum, stat) => sum + stat.closedSampleSize,
		0,
	);
	const detailedReadmes = stats.filter(
		(stat) => (stat.readmeBytes ?? 0) >= DETAILED_README_BYTES,
	).length;
	const licensed = maintained.filter((repo) => repo.license).length;
	const described = maintained.filter((repo) => repo.description).length;
	const releases = stats.filter((stat) => stat.latestRelease);

	return (
		<div className="flex flex-col gap-6">
			<article className="flex flex-col gap-2">
				<h3 className="text-lg font-bold">Maintenance</h3>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3">
					<Metric label="Avg issue close" value={formatDays(avgIssueClose)} />
					<Metric label="Avg PR close" value={formatDays(avgPRClose)} />
				</div>
				<p className="text-xs text-dim">
					Across top {maintained.length} repositories · last {closedSample}{" "}
					closed items
				</p>
			</article>
			<article className="flex flex-col gap-2">
				<h3 className="text-lg font-bold">Documentation & quality</h3>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3">
					<Metric
						label="Detailed READMEs"
						value={`${detailedReadmes}/${maintained.length}`}
					/>
					<Metric label="Licensed" value={`${licensed}/${maintained.length}`} />
					<Metric
						label="Described"
						value={`${described}/${maintained.length}`}
					/>
				</div>
			</article>
			<article className="flex flex-col gap-2">
				<h3 className="text-lg font-bold">Releases & packages</h3>
				{releases.length === 0 ? (
					<p className="text-sm text-dim">
						No published releases in these repositories.
					</p>
				) : (
					<ul className="flex flex-col gap-2">
						{releases.map((stat) => (
							<li
								key={stat.fullName}
								className="flex items-center justify-between gap-2 rounded-lg border border-stroke bg-background p-2"
							>
								<div className="flex min-w-0 flex-col">
									<p className="truncate text-sm font-medium">
										{stat.fullName}
									</p>
									<p className="text-xs text-dim">
										{stat.latestRelease?.tag} ·{" "}
										{formatDate(stat.latestRelease?.publishedAt ?? null)}
										{stat.latestRelease?.assetCount
											? ` · ${stat.latestRelease.assetCount} assets`
											: ""}
									</p>
								</div>
								<a
									href={stat.latestRelease?.url}
									target="_blank"
									rel="noreferrer"
									className="shrink-0 text-sm font-medium hover:underline"
								>
									View
								</a>
							</li>
						))}
					</ul>
				)}
			</article>
		</div>
	);
}
