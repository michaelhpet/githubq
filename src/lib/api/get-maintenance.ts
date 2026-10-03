import { useQueries } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { githubFetch, throwForStatus } from "./client";

export const MAINTENANCE_QUERY_KEY = "maintenance";

export interface RepoRelease {
	tag: string;
	url: string;
	publishedAt: string | null;
	assetCount: number;
}

interface ReleaseResponse {
	tag_name: string;
	html_url: string;
	published_at: string | null;
	assets: unknown[];
}

interface ClosedItemResponse {
	title: string;
	number: number;
	html_url: string;
	created_at: string;
	closed_at: string | null;
	pull_request?: Record<string, unknown>;
}

export interface RepoMaintenance {
	fullName: string;
	readmeBytes: number | null;
	latestRelease: RepoRelease | null;
	avgIssueCloseDays: number | null;
	avgPRCloseDays: number | null;
	closedSampleSize: number;
}

function daysBetween(startIso: string, endIso: string): number {
	return (
		(new Date(endIso).getTime() - new Date(startIso).getTime()) /
		(24 * 60 * 60 * 1000)
	);
}

function average(values: number[]): number | null {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function getReadmeBytes(
	fullName: string,
	token?: string | null,
): Promise<number | null> {
	const res = await githubFetch(`/repos/${fullName}/readme`, token);
	if (res.status === 404) return null;
	throwForStatus(res, `readme for "${fullName}"`);
	const body = (await res.json()) as { size?: number };
	return body.size ?? null;
}

async function getLatestRelease(
	fullName: string,
	token?: string | null,
): Promise<RepoRelease | null> {
	const res = await githubFetch(
		`/repos/${fullName}/releases?per_page=1`,
		token,
	);
	if (res.status === 404) return null;
	throwForStatus(res, `releases for "${fullName}"`);
	const body = (await res.json()) as ReleaseResponse[];
	const latest = body[0];
	if (!latest) return null;
	return {
		tag: latest.tag_name,
		url: latest.html_url,
		publishedAt: latest.published_at,
		assetCount: latest.assets.length,
	};
}

async function getCloseAverages(
	fullName: string,
	token?: string | null,
): Promise<{
	avgIssueCloseDays: number | null;
	avgPRCloseDays: number | null;
	closedSampleSize: number;
}> {
	const res = await githubFetch(
		`/repos/${fullName}/issues?state=closed&per_page=30&sort=updated&direction=desc`,
		token,
	);
	if (res.status === 404) {
		return {
			avgIssueCloseDays: null,
			avgPRCloseDays: null,
			closedSampleSize: 0,
		};
	}
	throwForStatus(res, `closed issues for "${fullName}"`);
	const items = (await res.json()) as ClosedItemResponse[];
	const closed = items.filter((item) => item.closed_at);
	const issueDays = closed
		.filter((item) => !item.pull_request)
		.map((item) => daysBetween(item.created_at, item.closed_at as string));
	const prDays = closed
		.filter((item) => item.pull_request)
		.map((item) => daysBetween(item.created_at, item.closed_at as string));
	return {
		avgIssueCloseDays: average(issueDays),
		avgPRCloseDays: average(prDays),
		closedSampleSize: closed.length,
	};
}

export function useMaintenance(fullNames: string[]) {
	const { token } = useSession();
	const authed = token ? "authed" : "anon";
	const results = useQueries({
		queries: fullNames.map((fullName) => ({
			queryKey: [MAINTENANCE_QUERY_KEY, fullName, authed],
			queryFn: async (): Promise<RepoMaintenance> => {
				const [readmeBytes, latestRelease, closeAverages] = await Promise.all([
					getReadmeBytes(fullName, token),
					getLatestRelease(fullName, token),
					getCloseAverages(fullName, token),
				]);
				return { fullName, readmeBytes, latestRelease, ...closeAverages };
			},
		})),
	});
	return {
		data: results.map((result) => result.data),
		isLoading: results.some((result) => result.isLoading),
		isError: results.some((result) => result.isError),
	};
}
