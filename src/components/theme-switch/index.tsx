import { useEffect, useId, useState } from "react";
import Switch from "@/components/switch";

function getInitialIsDark(): boolean {
  if (typeof window === "undefined") return false;
  if ("theme" in localStorage) return localStorage.theme === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function ThemeSwitch() {
  const [isDark, setIsDark] = useState(getInitialIsDark);
  const switchId = useId();

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
    <label
      htmlFor={switchId}
      className="flex items-center gap-2 cursor-pointer select-none"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span aria-hidden="true">{isDark ? "🌙" : "☀️"}</span>
      <Switch
        id={switchId}
        checked={isDark}
        onChange={(e) => setIsDark(e.target.checked)}
        aria-label="Toggle dark mode"
      />
    </label>
  );
}
