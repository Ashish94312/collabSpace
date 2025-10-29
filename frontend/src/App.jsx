// src/App.jsx
import React from "react";
import ThemeToggle from "./components/ThemeToggle";

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <h1 className="text-xl font-semibold">CollabSpace</h1>
        <div className="flex items-center gap-3">
          {/* place ThemeToggle where appropriate in your toolbar/header */}
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6">
        <div className="card rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-2">Welcome to CollabSpace</h2>
          <p className="text-sm text-muted-foreground">Your content goes here. The theme toggle above switches light/dark modes.</p>
        </div>
      </main>
    </div>
  );
}
