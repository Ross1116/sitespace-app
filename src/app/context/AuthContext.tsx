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

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

// ===== CONTEXT =====
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const initAttempted = useRef(false);

  // ===== Check auth status via server =====
  const checkAuth = useCallback(async (): Promise<User | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include", // sends HTTP-only cookies
      });

      if (!res.ok) return null;

      const userData = await res.json();
      return {
        id: userData.id || userData.user_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        user_type: userData.user_type,
      };
    } catch {
      return null;
    }
  }, []);

  // ===== Initialize: check if we have a valid session =====
  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    const init = async () => {
      const userData = await checkAuth();
      setUser(userData);
      setIsInitialized(true);
    };

    init();
  }, [checkAuth]);

  // ===== Login =====
  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);

      // Call API route, not the backend directly
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          data.message || data.detail || "Invalid email or password";
        setError(message);
        throw new Error(message);
      }

      //  Now fetch full profile (cookie is set by the API route)
      const userData = await checkAuth();

      if (!userData) {
        setError("Login succeeded but failed to load profile");
        throw new Error("Profile load failed");
      }

      setUser(userData);
      router.replace("/home");
    },
    [router, checkAuth],
  );

  // ===== Register =====
  const register = useCallback(
    async (data: RegisterData) => {
      setError(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone: data.phone,
            password: data.password,
          }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const message = errData.detail || "Registration failed";
        setError(message);
        throw new Error(message);
      }

      router.replace("/login?registered=true");
    },
    [router],
  );

  // ===== Logout =====
  const logout = useCallback(async () => {
    // Call API route to clear HTTP-only cookies (also invalidates backend token)
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});

    setUser(null);

    // Clear any cached data from localStorage
    if (typeof window !== "undefined") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key?.startsWith("project_") ||
          key?.startsWith("bookings_") ||
          key?.startsWith("assets_") ||
          key?.startsWith("subcontractors_") ||
          key?.startsWith("home_")
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    router.replace("/login");
  }, [router]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: !isInitialized,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, isInitialized, error, login, register, logout, clearError],
  );

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div
          className="animate-spin h-8 w-8 border-4 border-slate-200 border-t-slate-800 rounded-full"
          role="status"
          aria-label="Loading"
        />
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
