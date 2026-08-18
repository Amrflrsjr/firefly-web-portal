import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5236/api",
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
