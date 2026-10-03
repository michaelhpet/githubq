import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Exchanges a GitHub OAuth authorization code (+ PKCE verifier) for a
 * user access token. The client secret lives only here, server-side —
 * it must never be shipped to the browser.
 *
 * POST /api/auth/exchange  { code, codeVerifier?, redirectUri? }
 *   -> 200 { access_token } | 4xx/5xx { error }
 */
export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
): Promise<void> {
	if (req.method !== "POST") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	const { code, codeVerifier, redirectUri } = (req.body ?? {}) as {
		code?: unknown;
		codeVerifier?: unknown;
		redirectUri?: unknown;
	};
	if (typeof code !== "string" || code.length === 0) {
		res.status(400).json({ error: "Missing authorization code" });
		return;
	}

	const clientId = process.env.GITHUB_CLIENT_ID;
	const clientSecret = process.env.GITHUB_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		res.status(500).json({ error: "GitHub login is not configured" });
		return;
	}

	const params = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		code,
	});
	if (typeof redirectUri === "string" && redirectUri.length > 0) {
		params.set("redirect_uri", redirectUri);
	}
	if (typeof codeVerifier === "string" && codeVerifier.length > 0) {
		params.set("code_verifier", codeVerifier);
	}

	let tokenRes: Response;
	try {
		tokenRes = await fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params,
		});
	} catch {
		res.status(502).json({ error: "Could not reach GitHub" });
		return;
	}

	const body = (await tokenRes.json()) as {
		access_token?: string;
		error?: string;
		error_description?: string;
	};
	if (!tokenRes.ok || !body.access_token) {
		res
			.status(400)
			.json({ error: body.error_description ?? body.error ?? "Login failed" });
		return;
	}
	res.status(200).json({ access_token: body.access_token });
}
