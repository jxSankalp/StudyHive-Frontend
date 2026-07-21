import axios from "axios";
import { supabase } from "./supabaseClient";

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
  return config;
});

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { error?: unknown; message?: unknown } | undefined;
    if (typeof body?.error === "string") return body.error;
    if (typeof body?.message === "string") return body.message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

export default api;
