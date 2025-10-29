import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isDev =
    (typeof import !== "undefined" &&
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.MODE === "development") ||
    process.env.NODE_ENV === "development";

  if (isDev) {
    return children; // bypass auth in dev
  }

  // existing production check — edit the key to match your app
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
