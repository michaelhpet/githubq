import { Link, Outlet } from "react-router-dom";
import githubqIcon from "@/assets/icons/githubq-icon.svg";
import ThemeSwitch from "@/components/theme-switch";

export default function AppLayout() {
	return (
		<>
			<header className="w-full min-h-16 flex items-center border-b-[3px] border-stroke">
				<nav className="w-full max-w-[960px] mx-auto px-3 flex items-center justify-between gap-2">
					<Link to="/" className="flex items-center gap-2">
						<img src={githubqIcon} alt="githubq icon" className="w-8 h-8" />
						<p className="text-2xl font-bold">githubq</p>
					</Link>
					<ThemeSwitch />
				</nav>
			</header>
			<main className="max-w-[960px] mx-auto px-3">
				<Outlet />
			</main>
			<footer className="w-full min-h-16 flex items-center border-t-[3px] border-stroke">
				<article className="w-full max-w-[960px] flex items-center gap-2 mx-auto px-3 text-dim">
					<p>&copy;{new Date().getFullYear()}</p>
					<a href="https://michaelhpet.com" target="_blank" rel="noreferrer">
						Michael Peter
					</a>
				</article>
			</footer>
		</>
	);
}
