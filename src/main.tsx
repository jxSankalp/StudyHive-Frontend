import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { initTelemetry } from "./lib/telemetry";
import * as Sentry from "@sentry/react";

initTelemetry();

const savedTheme = localStorage.getItem("studyhive-theme");
const initialTheme = savedTheme === "light" || savedTheme === "dark"
  ? savedTheme
  : "light";
document.documentElement.classList.toggle("dark", initialTheme === "dark");
document.documentElement.style.colorScheme = initialTheme;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Sentry.ErrorBoundary fallback={<div className="grid min-h-screen place-items-center bg-background p-6 text-center"><div><h1 className="text-xl font-bold text-foreground">Something went wrong</h1><p className="mt-2 text-sm text-muted-foreground">The error was recorded. Refresh the page to continue.</p></div></div>}>
            <App />
          </Sentry.ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
