import axios from "axios";
import { supabase } from "./supabaseClient";
import { captureFrontendError } from "./telemetry";

export const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3000";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: false, // cookies no longer used; we send Bearer tokens
});

// Attach the Supabase access_token to every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["X-Request-ID"] = crypto.randomUUID();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && (!error.response || error.response.status >= 500)) {
      captureFrontendError(error, {
        requestId: error.config?.headers?.["X-Request-ID"],
        method: error.config?.method,
        url: error.config?.url,
        status: error.response?.status,
      });
    }
    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { error?: unknown; message?: unknown } | undefined;
    if (typeof body?.error === "string") return body.error;
    if (typeof body?.message === "string") return body.message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

export default api;
