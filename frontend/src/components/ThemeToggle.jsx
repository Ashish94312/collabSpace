import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

return (
  <div
    style={{
      position: "fixed",
      top: 12,
      right: 24,
      zIndex: 50
    }}
  >
    <button
      type="button"
      onClick={() => setDarkMode(v => !v)}
      aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
      title={`Switch to ${darkMode ? "light" : "dark"} mode`}
      // force size smaller (56x56); adjust here if needed
      style={{
        height: 56,
        width: 56,
        fontSize: 32,
        lineHeight: 1,
        borderWidth: 1,
        borderStyle: "solid",
        // match the dark frame to page bg; keep light frame slightly elevated
        borderColor: darkMode ? "#0b0f19" : "rgb(203,213,225)",
        backgroundColor: darkMode ? "transparent" : "rgba(255,255,255,0.9)",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        display: "grid",
        placeItems: "center",
        backdropFilter: "blur(6px)",
        transition: "background-color 150ms ease, border-color 150ms ease"
      }}
      onMouseEnter={(e) => {
        if (darkMode) {
          e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.6)";
        } else {
          e.currentTarget.style.backgroundColor = "rgb(241,245,249)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = darkMode
          ? "transparent"
          : "rgba(255,255,255,0.9)";
      }}
    >
      {darkMode ? (
        <span style={{ userSelect: "none" }}>☀️</span>
      ) : (
        <span style={{ userSelect: "none" }}>🌙</span>
      )}
    </button>
  </div>
);

}