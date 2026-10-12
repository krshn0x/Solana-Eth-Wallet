import { useEffect, useState } from "react";
const STORAGE_KEY = "solvault.theme";
function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || systemTheme(),
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#141621" : "#7560d5");
  }, [theme]);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    function changed() {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) setTheme(systemTheme());
      } catch {
        setTheme(systemTheme());
      }
    }
    function storage(event) {
      if (event.key === STORAGE_KEY)
        setTheme(
          event.newValue === "light" || event.newValue === "dark"
            ? event.newValue
            : systemTheme(),
        );
    }
    preference.addEventListener("change", changed);
    window.addEventListener("storage", storage);
    return () => {
      preference.removeEventListener("change", changed);
      window.removeEventListener("storage", storage);
    };
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Theme still works for this session. */
    }
  }
  return { theme, toggleTheme };
}
