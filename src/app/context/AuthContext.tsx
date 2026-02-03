// app/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";

// ===== TYPES =====
type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  user_type?: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<boolean>;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

// ===== STORAGE UTILITIES =====
// Abstracted storage - easy to switch between session/local storage
const AUTH_STORAGE_KEY = "auth_state";

const storage = {
  get: (): AuthState | null => {
    if (typeof window === "undefined") return null;
    try {
      const data = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  set: (state: AuthState): void => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to persist auth state:", e);
    }
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    // Clear any project/user-specific cached data
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (
        key?.startsWith("project_") ||
        key?.startsWith("bookings_") ||
        key?.startsWith("assets_") ||
        key?.startsWith("subcontractors_")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  },
};

// Cookie utility for SSR/middleware support (if needed)
const cookies = {
  set: (name: string, value: string, days: number = 7): void => {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
  },

  remove: (name: string): void => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  },
};

// ===== TOKEN UTILITIES =====
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Add 60 second buffer for clock skew
    return payload.exp * 1000 < Date.now() + 60000;
  } catch {
    return true;
  }
};

const getTokenExpiry = (token: string): Date | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
};

// ===== CONTEXT =====
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ===== Initialize auth state from storage =====
  useEffect(() => {
    const initAuth = async () => {
      const stored = storage.get();

      if (!stored?.accessToken) {
        setIsLoading(false);
        return;
      }

      // Check if access token is expired
      if (isTokenExpired(stored.accessToken)) {
        // Try to refresh
        if (stored.refreshToken && !isTokenExpired(stored.refreshToken)) {
          const refreshed = await attemptRefresh(stored.refreshToken);
          if (!refreshed) {
            storage.clear();
            cookies.remove("accessToken");
          }
        } else {
          storage.clear();
          cookies.remove("accessToken");
        }
      } else {
        // Token still valid
        setState(stored);
        cookies.set("accessToken", stored.accessToken);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // ===== Token Refresh =====
  const attemptRefresh = async (refreshToken: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      const newState: AuthState = {
        ...state,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };

      setState(newState);
      storage.set(newState);
      cookies.set("accessToken", data.access_token);

      return true;
    } catch {
      return false;
    }
  };

  // Public refresh method
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    if (!state.refreshToken) return false;
    return attemptRefresh(state.refreshToken);
  }, [state.refreshToken]);

  // ===== Login =====
  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Invalid email or password");
        }

        const data = await res.json();

        const user: User = {
          id: data.user_id,
          email: data.email || email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          user_type: data.user_type,
        };

        const newState: AuthState = {
          user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        };

        setState(newState);
        storage.set(newState);
        cookies.set("accessToken", data.access_token);

        // Use replace to prevent back button issues
        router.replace("/home");
      } catch (err: any) {
        const message = err.message || "Login failed. Please try again.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [API_URL, router],
  );

  // ===== Register =====
  const register = useCallback(
    async (data: RegisterData) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone: data.phone,
            password: data.password,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Registration failed");
        }

        router.replace("/login?registered=true");
      } catch (err: any) {
        const message = err.message || "Registration failed. Please try again.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [API_URL, router],
  );

  // ===== Logout =====
  const logout = useCallback(async () => {
    // Optimistically clear state first for better UX
    const currentToken = state.accessToken;

    setState({ user: null, accessToken: null, refreshToken: null });
    storage.clear();
    cookies.remove("accessToken");

    // Fire-and-forget logout request
    if (currentToken) {
      fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      }).catch(() => {
        // Ignore errors - we've already cleared local state
      });
    }

    router.replace("/login");
  }, [API_URL, router, state.accessToken]);

  // ===== Clear Error =====
  const clearError = useCallback(() => setError(null), []);

  // ===== Memoized Context Value =====
  const value = useMemo<AuthContextType>(
    () => ({
      user: state.user,
      accessToken: state.accessToken,
      isAuthenticated:
        !!state.accessToken && !isTokenExpired(state.accessToken),
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
      refreshAuth,
    }),
    [state, isLoading, error, login, register, logout, clearError, refreshAuth],
  );

  // Don't render children until we've checked auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-slate-800 rounded-full" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// ===== Custom hook for protected pages =====
export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isAuthenticated, isLoading };
}
