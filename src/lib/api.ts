import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  decrementNetworkActivity,
  incrementNetworkActivity,
} from "@/lib/networkActivity";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: {
      networkActivityId?: string;
    };
  }
}

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
  const activityId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  config.metadata = {
    ...config.metadata,
    networkActivityId: activityId,
  };
  incrementNetworkActivity();

  const originalPath = config.url || "";
  config.url = "";
  config.params = {
    ...config.params,
    path: originalPath,
  };
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.metadata?.networkActivityId) {
      decrementNetworkActivity();
      response.config.metadata.networkActivityId = undefined;
    }
    return response;
  },
  (error: AxiosError) => {
    const activityId = error.config?.metadata?.networkActivityId;
    if (activityId && error.config?.metadata) {
      decrementNetworkActivity();
      error.config.metadata.networkActivityId = undefined;
    }

    if (!error.response) {
      const message =
        error.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : "Unable to connect to server.";
      return Promise.reject(new Error(message));
    }

    if (error.response.status === 401) {
      // Don't redirect for public auth endpoints (forgot-password, reset-password, etc.)
      const requestPath = error.config?.params?.path || "";
      const isAuthRequest = requestPath.startsWith("/auth/");
      if (!isAuthRequest && typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
