import { useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import githubqIcon from "@/assets/icons/githubq-icon.svg";
import { Button } from "@/components/button";
import { ThemeSwitch } from "@/components/theme-switch";
import { useViewer } from "@/lib/api/get-viewer";
import { useSession } from "@/lib/auth/session";

function AuthStatus() {
	const { token, logout } = useSession();
	const { data: viewer, error } = useViewer();

	useEffect(() => {
		if (error && token) logout();
	}, [error, token, logout]);

	if (!token) return null;
	return (
		<div className="flex items-center gap-2">
			{viewer && (
				<img
					src={viewer.avatar_url}
					alt={viewer.login}
					title={viewer.login}
					className="h-8 w-8 rounded-full border border-stroke"
				/>
			)}
			<Button onClick={logout}>Logout</Button>
		</div>
	);
}

export function AppLayout() {
	return (
		<>
			<header className="w-full min-h-16 flex items-center border-b-[3px] border-stroke print:hidden">
				<nav className="w-full max-w-[960px] mx-auto px-7 flex items-center justify-between gap-2">
					<Link to="/" className="flex items-center gap-2">
						<img src={githubqIcon} alt="githubq icon" className="w-8 h-8" />
						<p className="text-2xl font-bold">githubq</p>
					</Link>
					<div className="flex items-center gap-2">
						<ThemeSwitch />
						<AuthStatus />
					</div>
				</nav>
			</header>
			<main className="max-w-[960px] mx-auto px-3">
				<Outlet />
			</main>
			<footer className="w-full min-h-16 flex items-center border-t-[3px] border-stroke print:hidden">
				<article className="w-full max-w-[960px] flex items-center gap-2 mx-auto px-7 text-dim">
					<p>&copy;{new Date().getFullYear()}</p>
					<a href="https://michaelhpet.com" target="_blank" rel="noreferrer">
						Michael Peter
					</a>
				</article>
			</footer>
		</>
	);
}
