import axios from "axios";

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
    // Check if the request was to any auth endpoint (/auth/login, /auth/register, etc.)
    const isAuthEndpoint = error.config?.url?.includes("/auth/");

    // Only redirect if a 401 happens on general protected data routes
    if (error.response?.status === 401 && !isAuthEndpoint) {
      console.warn("Unauthorized request - redirecting to login");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
