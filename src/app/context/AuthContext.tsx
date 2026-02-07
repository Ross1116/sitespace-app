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
  useRef,
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
    return payload.exp * 1000 < Date.now() + 60000;
  } catch {
    return true;
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
  // ✅ Separate: initial check vs. action-in-progress
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const refreshInFlight = useRef<Promise<boolean> | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ===== Token Refresh (stable ref, no state dependency in closure) =====
  const attemptRefresh = useCallback(
    async (refreshToken: string): Promise<boolean> => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) return false;

        const data = await res.json();

        setState((prev) => {
          const newState: AuthState = {
            ...prev,
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? prev.refreshToken,
          };
          storage.set(newState);
          cookies.set("accessToken", data.access_token);
          return newState;
        });

        return true;
      } catch {
        return false;
      }
    },
    [API_URL],
  );

  // ===== Initialize auth state from storage =====
  useEffect(() => {
    const initAuth = async () => {
      const stored = storage.get();

      if (!stored?.accessToken) {
        setIsInitialized(true);
        return;
      }

      if (isTokenExpired(stored.accessToken)) {
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
        setState(stored);
        cookies.set("accessToken", stored.accessToken);
      }

      setIsInitialized(true);
    };

    initAuth();
  }, [attemptRefresh]);

  // ===== Public refresh (deduplicated) =====
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const currentRefresh = state.refreshToken;
    if (!currentRefresh) return false;

    // Deduplicate concurrent refresh calls
    if (refreshInFlight.current) return refreshInFlight.current;

    const promise = attemptRefresh(currentRefresh).finally(() => {
      refreshInFlight.current = null;
    });

    refreshInFlight.current = promise;
    return promise;
  }, [state.refreshToken, attemptRefresh]);

  // ===== Login =====
  const login = useCallback(
    async (email: string, password: string) => {
      // ✅ Don't touch isInitialized — only set error state
      setError(null);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const message = errData.detail || "Invalid email or password";
        setError(message);
        throw new Error(message);
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

      router.replace("/home");
    },
    [API_URL, router],
  );

  // ===== Register =====
  const register = useCallback(
    async (data: RegisterData) => {
      setError(null);

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
        const message = errData.detail || "Registration failed";
        setError(message);
        throw new Error(message);
      }

      router.replace("/login?registered=true");
    },
    [API_URL, router],
  );

  // ===== Logout =====
  const logout = useCallback(async () => {
    const currentToken = state.accessToken;

    setState({ user: null, accessToken: null, refreshToken: null });
    storage.clear();
    cookies.remove("accessToken");

    if (currentToken) {
      fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      }).catch(() => {});
    }

    router.replace("/login");
  }, [API_URL, router, state.accessToken]);

  const clearError = useCallback(() => setError(null), []);

  // ===== Memoized Context Value =====
  const value = useMemo<AuthContextType>(
    () => ({
      user: state.user,
      accessToken: state.accessToken,
      isAuthenticated:
        !!state.accessToken && !isTokenExpired(state.accessToken),
      isLoading: !isInitialized,
      error,
      login,
      register,
      logout,
      clearError,
      refreshAuth,
    }),
    [
      state,
      isInitialized,
      error,
      login,
      register,
      logout,
      clearError,
      refreshAuth,
    ],
  );

  if (!isInitialized) {
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
