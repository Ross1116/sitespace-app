import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

//  No tokens in JavaScript — cookies are sent automatically
const api = axios.create({
  baseURL: "/api/proxy",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // sends cookies
});

//    Rewrite URLs: api.get("/bookings/my/upcoming")
//    becomes GET /api/proxy?path=/bookings/my/upcoming
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const originalPath = config.url || "";
  config.url = "";
  config.params = {
    ...config.params,
    path: originalPath,
  };
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      const message =
        error.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : "Unable to connect to server.";
      return Promise.reject(new Error(message));
    }

    if (error.response.status === 401) {
      // Session truly expired — redirect
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;

export const checkServerHealth = async (): Promise<boolean> => {
  try {
    // Health check goes direct — no auth needed
    await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
};
