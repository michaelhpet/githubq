import { useQuery } from "@tanstack/react-query";

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

export async function getProfile(username: string): Promise<GithubProfile> {
	const res = await fetch(
		`https://api.github.com/users/${encodeURIComponent(username)}`,
	);
	if (!res.ok) {
		throw new Error(
			`Could not fetch profile for "${username}" (${res.status})`,
		);
	}
	return res.json() as Promise<GithubProfile>;
}

export function useProfile(username: string | undefined) {
	return useQuery({
		queryKey: [PROFILE_QUERY_KEY, username],
		queryFn: () => getProfile(username as string),
		enabled: Boolean(username),
	});
}
