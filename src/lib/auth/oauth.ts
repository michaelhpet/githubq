const STATE_KEY = "githubq:oauth-state";
const VERIFIER_KEY = "githubq:oauth-verifier";
const RETURN_TO_KEY = "githubq:oauth-return-to";

function base64Url(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

export function randomString(byteLength: number): string {
	const bytes = new Uint8Array(byteLength);
	crypto.getRandomValues(bytes);
	return base64Url(bytes);
}

export async function s256Challenge(verifier: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(verifier),
	);
	return base64Url(new Uint8Array(digest));
}

export interface PendingLogin {
	url: string;
	state: string;
}

export async function buildAuthorizeUrl(): Promise<PendingLogin> {
	const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined;
	if (!clientId) {
		throw new Error(
			"GitHub login is not configured (missing VITE_GITHUB_CLIENT_ID)",
		);
	}
	const state = randomString(16);
	const verifier = randomString(32);
	const challenge = await s256Challenge(verifier);
	const redirectUri = `${window.location.origin}/callback`;

	sessionStorage.setItem(STATE_KEY, state);
	sessionStorage.setItem(VERIFIER_KEY, verifier);
	sessionStorage.setItem(
		RETURN_TO_KEY,
		`${window.location.pathname}${window.location.search}`,
	);

	const url = new URL("https://github.com/login/oauth/authorize");
	url.searchParams.set("client_id", clientId);
	url.searchParams.set("redirect_uri", redirectUri);
	url.searchParams.set("state", state);
	url.searchParams.set("code_challenge", challenge);
	url.searchParams.set("code_challenge_method", "S256");
	return { url: url.toString(), state };
}

export interface CompletedLogin {
	token: string;
	returnTo: string;
}

export async function completeLogin(
	code: string,
	state: string,
): Promise<CompletedLogin> {
	const savedState = sessionStorage.getItem(STATE_KEY);
	if (!state || state !== savedState) {
		throw new Error("Invalid login state — please try logging in again");
	}
	const verifier = sessionStorage.getItem(VERIFIER_KEY);
	const returnTo = sessionStorage.getItem(RETURN_TO_KEY) ?? "/";
	sessionStorage.removeItem(STATE_KEY);
	sessionStorage.removeItem(VERIFIER_KEY);
	sessionStorage.removeItem(RETURN_TO_KEY);

	const res = await fetch("/api/auth/exchange", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			code,
			codeVerifier: verifier,
			redirectUri: `${window.location.origin}/callback`,
		}),
	});
	const body = (await res.json()) as {
		access_token?: string;
		error?: string;
	};
	if (!res.ok || !body.access_token) {
		throw new Error(body.error ?? "GitHub login failed");
	}
	return { token: body.access_token, returnTo };
}
