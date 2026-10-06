import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { githubFetch, throwForStatus } from "./client";

export const ACTIVITY_QUERY_KEY = "activity";

const MAX_PAGES = 10;

function getNextPage(linkHeader: string | null): string | null {
	if (!linkHeader) return null;
	const match = linkHeader.match(/<([^>]+)>\s*;\s*rel="next"/);
	return match ? match[1].replace("https://api.github.com", "") : null;
}

export interface GithubEvent {
	id: string;
	type: string;
	created_at: string;
	repo: { name: string };
	payload: {
		action?: string;
		size?: number;
		distinct_size?: number;
		before?: string;
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

export async function getUserEvents(
	username: string,
	token?: string | null,
): Promise<GithubEvent[]> {
	const events: GithubEvent[] = [];
	let path: string | null =
		`/users/${encodeURIComponent(username)}/events/public?per_page=100`;
	for (let page = 0; page < MAX_PAGES && path; page++) {
		const res = await githubFetch(path, token);
		throwForStatus(res, `activity for "${username}"`);
		const pageEvents = (await res.json()) as GithubEvent[];
		events.push(...pageEvents);
		path = getNextPage(res.headers.get("Link"));
	}
	return events;
}

export function useActivity(username: string | undefined) {
	const { token } = useSession();
	return useQuery({
		queryKey: [ACTIVITY_QUERY_KEY, username, token ? "authed" : "anon"],
		queryFn: () => getUserEvents(username as string, token),
		enabled: Boolean(username),
	});
}
