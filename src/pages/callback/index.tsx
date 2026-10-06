import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { completeLogin } from "@/lib/auth/oauth";
import { useSession } from "@/lib/auth/session";

export function Callback() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { storeToken } = useSession();
	const [error, setError] = useState<string | null>(null);
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const denied = searchParams.get("error");
		if (denied) {
			setError("GitHub login was cancelled");
			return;
		}
		if (!code || !state) {
			setError("Invalid login response — please try again");
			return;
		}
		completeLogin(code, state)
			.then(({ token, returnTo }) => {
				storeToken(token);
				navigate(returnTo, { replace: true });
			})
			.catch((err: unknown) => {
				setError(err instanceof Error ? err.message : "GitHub login failed");
			});
	}, [searchParams, storeToken, navigate]);

	if (error) {
		return (
			<div className="flex min-h-[calc(100vh-128px)] flex-col items-center justify-center gap-3 text-center">
				<p className="text-sm font-medium text-red-500">🚫&nbsp;{error}</p>
				<Link to="/" className="text-sm font-medium hover:underline">
					Back to home
				</Link>
			</div>
		);
	}
	return (
		<div className="flex min-h-[calc(100vh-128px)] items-center justify-center">
			<p className="text-sm text-dim">Finishing GitHub login…</p>
		</div>
	);
}
