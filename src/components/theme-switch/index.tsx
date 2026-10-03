import { IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";

function getInitialIsDark(): boolean {
	if (typeof window === "undefined") return false;
	if ("theme" in localStorage) return localStorage.theme === "dark";
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeSwitch() {
	const [isDark, setIsDark] = useState(getInitialIsDark);

	useEffect(() => {
		if (isDark) {
			document.documentElement.classList.add("dark");
			localStorage.theme = "dark";
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.theme = "light";
		}
	}, [isDark]);

	return (
		<button
			type="button"
			onClick={() => setIsDark((dark) => !dark)}
			title={isDark ? "Switch to light mode" : "Switch to dark mode"}
			aria-label="Toggle dark mode"
			className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-transparent bg-transparent text-foreground transition hover:border-stroke"
		>
			{isDark ? <IconMoon size={20} /> : <IconSun size={20} />}
		</button>
	);
}
