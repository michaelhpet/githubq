import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { githubFetch, throwForStatus } from "./client";

export const VIEWER_QUERY_KEY = "viewer";

export interface GithubViewer {
	login: string;
	avatar_url: string;
	name: string | null;
}

export async function getViewer(token: string): Promise<GithubViewer> {
	const res = await githubFetch("/user", token);
	throwForStatus(res, "authenticated user");
	return res.json() as Promise<GithubViewer>;
}

export function useViewer() {
	const { token } = useSession();
	return useQuery({
		queryKey: [VIEWER_QUERY_KEY, token ? "authed" : "anon"],
		queryFn: () => getViewer(token as string),
		enabled: Boolean(token),
		retry: false,
	});
}
