import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Button } from "@/components/button";
import { Skeleton } from "@/components/skeleton";
import { Tag } from "@/components/tag";
import { useProfile } from "@/lib/api/get-profile";
import { clearPersistedCache } from "@/lib/query-client";

export function Developer() {
	const { username } = useParams();
	const queryClient = useQueryClient();
	const { data, isLoading, isError, error } = useProfile(username);

	if (isLoading) return <DeveloperSkeleton />;

	async function auditAgain(): Promise<void> {
		await queryClient.cancelQueries();
		queryClient.removeQueries();
		await clearPersistedCache();
	}

	return (
		<div className="flex flex-col-reverse items-start justify-between gap-3 md:flex-row">
			<div className="flex items-center gap-2">
				{isError ? (
					<p className="text-sm font-medium text-red-500">
						🚫&nbsp;
						{error instanceof Error ? error.message : "Could not load profile"}
					</p>
				) : (
					<>
						<img
							src={data?.avatar_url}
							alt={data?.login ?? "Profile photo"}
							className="w-20 h-20 rounded-lg"
						/>
						<article className="flex flex-col">
							<Tag size="small">{username}</Tag>
							<p className="font-bold">
								{data?.name ?? data?.login ?? "Anonymous"}
							</p>
							<p className="max-w-64 text-sm text-dim truncate">
								{data?.bio ?? "-"}
							</p>
						</article>
					</>
				)}
			</div>
			<div className="flex items-center gap-2 print:hidden">
				<Button variant="outlined" onClick={() => void auditAgain()}>
					Audit again
				</Button>
				<Button onClick={() => window.print()}>Download</Button>
			</div>
		</div>
	);
}

function DeveloperSkeleton() {
	return (
		<div className="flex flex-col-reverse items-start justify-between gap-3 md:flex-row">
			<div className="flex items-center gap-2">
				<Skeleton className="h-20 w-20 rounded-lg" />
				<article className="flex flex-col gap-1">
					<Skeleton className="h-5 w-16" />
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-4 w-56" />
				</article>
			</div>
			<div className="flex items-center gap-2">
				<Skeleton className="h-9 w-28" />
				<Skeleton className="h-9 w-24" />
			</div>
		</div>
	);
}
