"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Check authentication status and redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/home");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
      // After successful login, redirect to home
    } catch (err: any) {
      // Handle different types of errors with user-friendly messages
      if (!navigator.onLine) {
        setError("Network error: Please check your internet connection.");
      } else if (err.message?.includes("timeout") || err.code === "ECONNABORTED") {
        setError("Connection timeout: The server is taking too long to respond. Please try again later.");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Invalid username or password. Please try again.");
      } else if (err.response?.status >= 500) {
        setError("Server error: Something went wrong on our end. Please try again later.");
      } else {
        setError(`Login failed: ${err.message || "Unknown error"}. Please try again.`);
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
    router.push("/home");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      {/* Left Side */}
      <div className="hidden md:flex md:w-1/2 bg-amber-700 px-32 py-16 flex-col justify-between relative">
        <div className="z-10 mx-auto">
          {/* Asterisk/Star Logo */}
          <div className="text-white text-9xl my-12">*</div>

          {/* Main Text */}
          <h1 className="text-7xl font-bold text-white mb-12">
            Hello
            <br className="mb-4"/>
            Sitespacer!<span className="text-7xl">👋</span>
          </h1>

          {/* Subtext */}
          <p className="text-gray-300 text-xl max-w-8/12">
            Skip repetitive and manual scheduling. Get highly productive through
            automation and save tons of time!
          </p>
        </div>

        {/* Copyright */}
        <div className="text-white/70 text-sm">
          © 2025 Sitespace. All rights reserved.
        </div>

        {/* Background Pattern - Subtle curved lines */}
        <div className="absolute inset-0 opacity-10">
          {/* This would be better with an actual SVG but using a div for simplicity */}
        </div>
      </div>

      {/* Right Side - White Section */}
      <div className="w-full md:w-1/2 bg-orange-50 flex items-center justify-center min-h-screen md:min-h-0 md:p-16">
        <div className="max-w-md w-full px-6 py-12 md:p-0">
          {/* Logo */}
          <h2 className="text-4xl md:text-5xl font-bold mb-8 md:mb-16">Sitespace</h2>

          {/* Welcome Text */}
          <h3 className="text-2xl md:text-3xl font-bold mb-2">Welcome Back!</h3>

          {/* Create Account Text */}
          <p className="text-gray-600 mb-8">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-blue-600 font-medium">
              Create a new account now
            </a>
            .
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
                disabled={isLoading}
              />
            </div>

            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
                disabled={isLoading}
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className={`w-full py-3 px-4 bg-black text-white font-medium rounded relative ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="opacity-0">Login Now</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </>
                ) : (
                  "Login Now"
                )}
              </button>
            </div>

            {/* <div className="text-center text-gray-500 text-sm">
              Forgot password?{" "}
              <a href="#" className="text-black font-medium">
                Click here
              </a>
            </div> */}
          </form>
          
          {/* Mobile-only footer */}
          <div className="md:hidden text-center text-gray-500 text-xs mt-8">
            © 2025 Sitespace. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}