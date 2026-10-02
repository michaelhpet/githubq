import { useQuery } from "@tanstack/react-query";

export const ACTIVITY_QUERY_KEY = "activity";

/**
 * Safety cap on pages followed. Timelines hold ~300 events, but the
 * `Link: rel="next"` header (not page size) decides when to stop.
 */
const MAX_PAGES = 10;

function getNextPage(linkHeader: string | null): string | null {
	if (!linkHeader) return null;
	const match = linkHeader.match(/<([^>]+)>\s*;\s*rel="next"/);
	return match ? match[1] : null;
}

export interface GithubEvent {
	id: string;
	type: string;
	created_at: string;
	repo: { name: string };
	payload: {
		action?: string;
		size?: number;
		commits?: unknown[];
		pull_request?: {
			number: number;
			title: string;
			html_url: string;
			merged: boolean;
			merged_at: string | null;
		};
	};
}

export async function getUserEvents(username: string): Promise<GithubEvent[]> {
	const events: GithubEvent[] = [];
	let url: string | null =
		`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`;
	for (let page = 0; page < MAX_PAGES && url; page++) {
		const res = await fetch(url, {
			headers: { Accept: "application/vnd.github+json" },
		});
		if (res.status === 403) {
			const reset = res.headers.get("x-ratelimit-reset");
			const when = reset
				? ` (resets at ${new Date(Number(reset) * 1000).toLocaleTimeString()})`
				: "";
			throw new Error(`GitHub API rate limit exceeded${when}`);
		}
		if (!res.ok) {
			throw new Error(
				`Could not fetch activity for "${username}" (${res.status})`,
			);
		}
		const pageEvents = (await res.json()) as GithubEvent[];
		events.push(...pageEvents);
		url = getNextPage(res.headers.get("Link"));
	}
	return events;
}

export function useActivity(username: string | undefined) {
	return useQuery({
		queryKey: [ACTIVITY_QUERY_KEY, username],
		queryFn: () => getUserEvents(username as string),
		enabled: Boolean(username),
	});
}
