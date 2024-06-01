import { useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import githubqIcon from "@/assets/icons/githubq-icon.svg";

export default function AppLayout() {
  useEffect(() => {
    const isDarkMode =
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  return (
    <>
      <header className="w-full min-h-16 flex items-center border-b-[3px] border-stroke">
        <nav className="max-w-[960px] mx-auto px-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={githubqIcon} alt="githubq icon" className="w-8 h-8" />
            <p className="text-2xl font-bold">githubq</p>
          </Link>
        </nav>
      </header>
      <main className="max-w-[960px] mx-auto px-3">
        <Outlet />
      </main>
      <footer className="w-full min-h-16 flex items-center border-t-[3px] border-stroke">
        <nav className="max-w-[960px] mx-auto px-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={githubqIcon} alt="githubq icon" className="w-8 h-8" />
            <p className="text-2xl font-bold">githubq</p>
          </Link>
        </nav>
      </footer>
    </>
  );
}
