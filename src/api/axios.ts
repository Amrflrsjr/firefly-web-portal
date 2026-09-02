import axios from "axios";

// Dynamically check for local dev vs production URL
const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5236/api"
    : "https://portal.fireflycraftsph.com/api");

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT Bearer Token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-handle expired or invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized request - redirecting to login");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
