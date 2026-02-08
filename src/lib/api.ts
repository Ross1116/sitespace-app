// lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const AUTH_STORAGE_KEY = "auth_state";

// Get token from sessionStorage
const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const data = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data).accessToken : null;
  } catch {
    return null;
  }
};

const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const data = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data).refreshToken : null;
  } catch {
    return null;
  }
};

const updateTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === "undefined") return;
  try {
    const data = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      parsed.accessToken = accessToken;
      parsed.refreshToken = refreshToken;
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
    }
    // Also update the cookie so middleware stays in sync
    const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
    document.cookie = `accessToken=${encodeURIComponent(accessToken)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
  } catch {
    // Ignore storage errors
  }
};

const clearAuth = (): void => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  // Clear the cookie so middleware doesn't see a stale token
  document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
};

const redirectToLogin = (): void => {
  if (typeof window === "undefined") return;
  // Use Next.js-compatible navigation instead of window.location.href
  window.location.replace("/login");
};

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor with token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Network error or timeout
    if (!error.response) {
      const message =
        error.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : "Unable to connect to server. Please check your connection.";
      return Promise.reject(new Error(message));
    }

    // Handle 401 - Unauthorized
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refresh_token: refreshToken },
        );

        const { access_token, refresh_token } = response.data;

        updateTokens(access_token, refresh_token);
        processQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// Health check utility
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    await api.get("/health", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};