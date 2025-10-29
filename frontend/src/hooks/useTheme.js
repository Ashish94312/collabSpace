// src/hooks/useTheme.js
import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "collabspace:theme"; // persist key

function getPreferredTheme() {
  // 1) explicit saved value
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch (e) {
    // ignore
  }

  // 2) system preference
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  // default
  return "light";
}

export default function useTheme() {
  const [theme, setThemeState] = useState(() => getPreferredTheme());

  const applyTheme = useCallback((t) => {
    const root = document.documentElement;
    if (!root) return;
    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }, [theme, applyTheme]);

  // observe system preference changes so the app can respond
  useEffect(() => {
    const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handle = (e) => {
      // only change if user hasn't explicitly saved a preference
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) return;
      } catch (err) {}
      setThemeState(e.matches ? "dark" : "light");
    };
    if (mq.addEventListener) mq.addEventListener("change", handle);
    else mq.addListener(handle);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handle);
      else mq.removeListener(handle);
    };
  }, []);

  const setTheme = useCallback((t) => {
    if (t !== "dark" && t !== "light") return;
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggle };
}
