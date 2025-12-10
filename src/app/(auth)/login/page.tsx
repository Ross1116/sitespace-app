"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);

  const { login, isAuthenticated, error: authError, clearError } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace("/home");
  }, [isAuthenticated, router]);

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Sync auth errors with local error
  useEffect(() => {
    if (authError) setLocalError(authError);
  }, [authError]);

  const validateField = (field: string, value: string) => {
    if (field === "email" && touched.email && !value.trim()) {
      return "Email is required";
    }
    if (field === "password" && touched.password && value.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError("Please enter both email and password");
      setTouched({ email: true, password: true });
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage =
        err?.message || authError || "Something went wrong. Please try again";

      if (
        errorMessage.includes("401") ||
        errorMessage.toLowerCase().includes("invalid") ||
        errorMessage.toLowerCase().includes("failed")
      ) {
        setLocalError("Invalid email or password");
      } else if (errorMessage.includes("429")) {
        setLocalError("Too many attempts. Please try again later");
      } else if (
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("connect")
      ) {
        setLocalError(
          "Connection error. Please check your internet and try again"
        );
      } else {
        setLocalError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const Logo = () => (
    <svg viewBox="0 0 100 100" className="w-24 h-24 text-white">
      <text x="50" y="75" fontSize="80" textAnchor="middle" fill="currentColor">
        *
      </text>
    </svg>
  );

  const displayError = localError || authError;

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      {/* Left Side */}
      <div className="hidden md:flex md:w-1/2 bg-amber-700 px-32 py-16 flex-col justify-between relative">
        <div className="z-10 mx-auto">
          <div className="my-12">
            <Logo />
          </div>

          <h1 className="text-7xl font-bold text-white mb-12">
            Hello
            <br className="mb-4" />
            Sitespacer!<span className="text-7xl">👋</span>
          </h1>

          <p className="text-gray-300 text-xl max-w-8/12">
            {/* Skip repetitive and manual scheduling. Get highly productive through
            automation and save tons of time! */}
          </p>
        </div>

        <div className="text-white/70 text-sm">
          © 2025 Sitespace. All rights reserved.
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            preserveAspectRatio="none"
          >
            <pattern
              id="curves"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 50 Q 25 25, 50 50 T 100 50"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M0 25 Q 25 0, 50 25 T 100 25"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M0 75 Q 25 50, 50 75 T 100 75"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#curves)" />
          </svg>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full md:w-1/2 bg-orange-50 flex items-center justify-center min-h-screen md:min-h-0 md:p-16">
        <div className="max-w-md w-full px-6 py-12 md:p-0">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 md:mb-16">
            Sitespace
          </h2>

          <h3 className="text-2xl md:text-3xl font-bold mb-2">Welcome Back!</h3>

          <p className="text-gray-600 mb-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Create a new account now
            </Link>
            .
          </p>

          {displayError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm animate-shake">
              <strong className="font-bold">Error: </strong>
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLocalError("");
                  clearError();
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                placeholder="Email"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              />
              {touched.email && validateField("email", email) && (
                <p className="text-red-500 text-xs mt-1">
                  {validateField("email", email)}
                </p>
              )}
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLocalError("");
                  clearError();
                }}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, password: true }))
                }
                placeholder="Password"
                className="w-full p-3 pr-12 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              />

              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={20} strokeWidth={2} />
                ) : (
                  <Eye size={20} strokeWidth={2} />
                )}
              </button>

              {touched.password && validateField("password", password) && (
                <p className="text-red-500 text-xs mt-1">
                  {validateField("password", password)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className={`w-full py-3 px-4 bg-black text-white font-medium rounded relative transition-opacity ${
                  isLoading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:opacity-90"
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="opacity-0">Login Now</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </span>
                  </>
                ) : (
                  "Login Now"
                )}
              </button>
            </div>
          </form>

          <div className="md:hidden text-center text-gray-500 text-xs mt-8">
            © 2025 Sitespace. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
