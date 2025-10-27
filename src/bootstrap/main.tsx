import { StrictMode, Fragment } from "react";
import { createRoot } from "react-dom/client";
import "../presentation/styles/index.css";
import App from "../presentation/App";
import { AppProviders } from "./AppProviders";

const loadRuntimeConfig = async () => {
  try {
    const res = await fetch("/app-config.json", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as Record<string, unknown>;
    if (data && typeof data === "object") {
      window.__APP_CONFIG__ = { ...(window.__APP_CONFIG__ ?? {}), ...data };
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[config] Unable to load app-config.json:", error);
    }
  }
};

const RootBoundary = import.meta.env.DEV ? Fragment : StrictMode;

const start = () => {
  createRoot(document.getElementById("root")!).render(
    <RootBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </RootBoundary>
  );
};

loadRuntimeConfig().finally(start);
