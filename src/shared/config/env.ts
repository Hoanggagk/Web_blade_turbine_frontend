const sanitizeBaseUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Remove trailing slashes to avoid double slash when joining paths.
  return trimmed.replace(/\/+$/, "");
};

const runtimeBase =
  typeof window !== "undefined" && window.__APP_CONFIG__
    ? (window.__APP_CONFIG__ as { API_BASE_URL?: string }).API_BASE_URL
    : undefined;

const candidates = [
  typeof import.meta !== "undefined" ? import.meta.env.VITE_API_BASE : undefined,
  runtimeBase,
];

let resolvedBase = candidates
  .map((candidate) => sanitizeBaseUrl(candidate))
  .find((candidate): candidate is string => Boolean(candidate));

if (!resolvedBase) {
  console.warn(
    "[config] Missing VITE_API_BASE; falling back to relative '/api/v1'."
  );
  resolvedBase = "/api/v1";
}

export const API_BASE_URL = resolvedBase;

export const withApiBase = (path: string): string => {
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
};

declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE_URL?: string;
      [key: string]: unknown;
    };
  }
}

