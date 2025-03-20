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
  id: string | null;
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
    password: string
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

      // Use the full URL from environment variables
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }).catch(err => {
        // Network error (server down, no connection, etc.)
        throw new Error("Cannot connect to server. Please check your connection or try again later.", err);
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 
          (response.status === 401 ? "Invalid username or password" : 
           response.status === 403 ? "Access denied" : 
           `Login failed (${response.status})`);
        
        throw new Error(errorMessage);
      }

      const data = await response.json().catch(() => {
        throw new Error("Invalid response from server");
      });

      if (!data.accessToken) {
        throw new Error("Invalid login response (no token)");
      }

      // Store user and token
      const userData = {
        id: data.id,
        username: data.username,
        email: data.email,
        roles: data.roles,
      };

      setUser(userData);
      setToken(data.accessToken);

      // Save to localStorage
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(userData));

      router.push("/home");
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      
      // Display alert for user feedback
      alert(`Login failed: ${errorMessage}`);
      
      throw error;
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
    password: string
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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    router.push("/login");
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