export class GitHubApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

function rateLimitMessage(res: Response): string {
	const reset = res.headers.get("x-ratelimit-reset");
	const when = reset
		? ` (resets at ${new Date(Number(reset) * 1000).toLocaleTimeString()})`
		: "";
	return `GitHub API rate limit exceeded${when}`;
}

export async function githubFetch(
	path: string,
	token?: string | null,
	init?: RequestInit,
): Promise<Response> {
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		...(init?.headers as Record<string, string> | undefined),
	};
	if (token) headers.Authorization = `Bearer ${token}`;
	return fetch(`https://api.github.com${path}`, { ...init, headers });
}

export function throwForStatus(res: Response, resource: string): void {
	if (res.status === 403 || res.status === 429) {
		throw new GitHubApiError(rateLimitMessage(res), res.status);
	}
	if (!res.ok) {
		throw new GitHubApiError(
			`Could not fetch ${resource} (${res.status})`,
			res.status,
		);
	}
}
