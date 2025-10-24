import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const API_BASE_URL = import.meta.env.DEV
  ? "/api" // use Vite proxy during development
  : import.meta.env.VITE_BACKEND_URL; // use full URL in production

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // required for cookies/sessions
});

// Request interceptor to add Clerk token
api.interceptors.request.use(
  async (config) => {
    // Get session token from Clerk
    const { getToken } = useAuth(); // browser SDK
    const token = await getToken({ template: "default" }); // or your custom template

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
