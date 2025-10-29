
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Immediately apply the saved or preferred theme before React paints
(function initTheme() {
  try {
    const STORAGE_KEY = "collabspace:theme";
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved === "dark" || saved === "light" ? saved : (prefersDark ? "dark" : "light");
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  } catch (e) {
    // ignore
  }
})();

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
