import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { githubFetch, throwForStatus } from "./client";

export const PROFILE_QUERY_KEY = "profile";

export interface GithubProfile {
	login: string;
	id: number;
	avatar_url: string;
	html_url: string;
	name: string | null;
	bio: string | null;
	public_repos: number;
	followers: number;
	following: number;
}

export async function getProfile(
	username: string,
	token?: string | null,
): Promise<GithubProfile> {
	const res = await githubFetch(
		`/users/${encodeURIComponent(username)}`,
		token,
	);
	throwForStatus(res, `profile for "${username}"`);
	return res.json() as Promise<GithubProfile>;
}

export function useProfile(username: string | undefined) {
	const { token } = useSession();
	return useQuery({
		queryKey: [PROFILE_QUERY_KEY, username, token ? "authed" : "anon"],
		queryFn: () => getProfile(username as string, token),
		enabled: Boolean(username),
	});
}
