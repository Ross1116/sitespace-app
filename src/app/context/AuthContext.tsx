"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type User = {
  userId: string | null;
  username: string;
  email: string;
  roles: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    companyName: string,
    tradeCategory: string,
    email: string,
    phoneNumber: string,
    password: string,
    project: string,
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    // Check for token in localStorage on initial load
    const storedToken = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  const clearError = () => {
    setError(null);
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed (${response.status})`);
      }

      const data = await response.json();
      if (!data.accessToken) throw new Error("Invalid login response (no token)");

      // Store user and token
      const userData = {
        userId: data.userId,
        username: data.username,
        email: data.email,
        roles: data.roles,
      };

      setUser(userData);
      setToken(data.accessToken);

      // Save to localStorage
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Redirect to home AFTER storing everything
      await router.push("/home");

    } catch (error: any) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      alert(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    fullName: string,
    companyName: string,
    tradeCategory: string,
    email: string,
    phoneNumber: string,
    password: string,
    project: string,
  ) => {
    try {
      setIsLoading(true);
      clearError();

      // Extract username from email or use first part of fullName
      const username = email.split('@')[0] || fullName.split(' ')[0].toLowerCase();

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          fullName,
          companyName,
          tradeCategory,
          email,
          phoneNumber,
          password,
          project,
        }),
      }).catch(err => {
        // Network error (server down, no connection, etc.)
        throw new Error("Cannot connect to server. Please check your connection or try again later.", err);
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Registration failed (${response.status})`;
        throw new Error(errorMessage);
      }

      // After successful registration, redirect to login
      router.push("/login?registered=true");

    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);

      // Display alert for user feedback
      alert(`Registration failed: ${errorMessage}`);

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      clearError();
      const response = await fetch(`${API_URL}/api/auth/signout`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed (${response.status})`);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      alert(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
      setUser(null);
      setToken(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("assets");
      localStorage.removeItem("bookings");
      router.push("/");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        error,
        clearError,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
