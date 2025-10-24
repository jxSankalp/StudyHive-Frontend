import axios from "axios";

const API_BASE_URL = import.meta.env.DEV
  ? "/api" // use Vite proxy during development
  : import.meta.env.VITE_BACKEND_URL; // use full URL in production

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // optional, if you're using cookies or sessions
});

export default api;