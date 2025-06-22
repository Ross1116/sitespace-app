"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tradeCategory, setTradeCategory] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    companyName: false,
    tradeCategory: false,
    email: false,
    phoneNumber: false,
    password: false,
    confirmPassword: false,
  });

  const { register, error: authError, clearError, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = params.projectId as string;

  // Show success message if redirected from successful registration
  const justRegistered = searchParams.get('registered') === 'true';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, router]);

  // Sync auth errors with local error state
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return "Full name is required";
        if (value.trim().length < 2) return "Full name must be at least 2 characters";
        break;
      case 'companyName':
        if (!value.trim()) return "Company name is required";
        break;
      case 'tradeCategory':
        if (!value.trim()) return "Trade category is required";
        break;
      case 'email':
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        break;
      case 'phoneNumber':
        if (!value.trim()) return "Phone number is required";
        if (!/^[\d\s\-\+\(\)]+$/.test(value)) return "Invalid phone number format";
        break;
      case 'password':
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
          return "Password must contain uppercase, lowercase, and number";
        break;
      case 'confirmPassword':
        if (!value) return "Please confirm your password";
        if (value !== password) return "Passwords do not match";
        break;
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    // Validate all fields
    const fields = { fullName, companyName, tradeCategory, email, phoneNumber, password, confirmPassword };
    const errors = Object.entries(fields).map(([key, value]) => validateField(key, value)).filter(Boolean);

    if (errors.length > 0) {
      setLocalError(errors[0]);
      setTouched({
        fullName: true,
        companyName: true,
        tradeCategory: true,
        email: true,
        phoneNumber: true,
        password: true,
        confirmPassword: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(
        fullName,
        companyName,
        tradeCategory,
        email,
        phoneNumber,
        password,
        project
      );
    } catch (err: any) {
      console.error("Registration error:", err);

      const errorMessage = err?.message || authError || "Registration failed. Please try again.";

      // Parse specific error types
      if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("exist")) {
        setLocalError("An account with this email already exists");
      } else if (errorMessage.toLowerCase().includes("username") && errorMessage.toLowerCase().includes("exist")) {
        setLocalError("This username is already taken");
      } else if (errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("connect")) {
        setLocalError("Connection error. Please check your internet and try again");
      } else {
        setLocalError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const Logo = () => (
    <svg viewBox="0 0 100 100" className="w-24 h-24 text-white">
      <text x="50" y="75" fontSize="80" textAnchor="middle" fill="currentColor">*</text>
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
            Join
            <br className="mb-4" />
            Sitespace!<span className="text-7xl">🚀</span>
          </h1>

          <p className="text-gray-300 text-xl max-w-8/12">
            Start managing your projects efficiently. Get organized, collaborate
            better, and deliver projects on time with our powerful scheduling
            platform!
          </p>
        </div>

        <div className="text-white/70 text-sm">
          © 2025 Sitespace. All rights reserved.
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
            <pattern id="curves" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M0 50 Q 25 25, 50 50 T 100 50" stroke="white" strokeWidth="2" fill="none" />
              <path d="M0 25 Q 25 0, 50 25 T 100 25" stroke="white" strokeWidth="1.5" fill="none" />
              <path d="M0 75 Q 25 50, 50 75 T 100 75" stroke="white" strokeWidth="1.5" fill="none" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#curves)" />
          </svg>
        </div>
      </div>

      {/* Right Side - White Section */}
      <div className="w-full md:w-1/2 bg-orange-50 flex items-center justify-center min-h-screen md:min-h-0 md:p-16">
        <div className="max-w-md w-full px-6 py-12 md:p-0">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Sitespace</h2>

          <h3 className="text-2xl md:text-3xl font-bold mb-2">
            Create Account
          </h3>

          <p className="text-gray-600 mb-8">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Login here
            </Link>
            .
          </p>

          {/* Success Message */}
          {justRegistered && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
              <strong className="font-bold">Success! </strong>
              <span>Registration complete. Please login to continue.</span>
            </div>
          )}

          {/* Error Message */}
          {displayError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm animate-shake">
              <strong className="font-bold">Error: </strong>
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setLocalError("");
                  clearError();
                }}
                onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
                placeholder="Full Name"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              />
              {touched.fullName && validateField('fullName', fullName) && (
                <p className="text-red-500 text-xs mt-1">{validateField('fullName', fullName)}</p>
              )}
            </div>

            <div>
              <input
                id="companyName"
                name="companyName"
                type="text"
                autoComplete="organization"
                required
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setLocalError("");
                  clearError();
                }}
                onBlur={() => setTouched(prev => ({ ...prev, companyName: true }))}
                placeholder="Company Name"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              />
              {touched.companyName && validateField('companyName', companyName) && (
                <p className="text-red-500 text-xs mt-1">{validateField('companyName', companyName)}</p>
              )}
            </div>

            <div>
              <select
                id="tradeCategory"
                name="tradeCategory"
                required
                value={tradeCategory}
                onChange={(e) => {
                  setTradeCategory(e.target.value);
                  setLocalError("");
                  clearError();
                }}
                onBlur={() => setTouched(prev => ({ ...prev, tradeCategory: true }))}
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg transition-colors appearance-none"
                disabled={isLoading}
              >
                <option value="">Select Trade Category</option>
                <option value="construction">Construction</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="hvac">HVAC</option>
                <option value="carpentry">Carpentry</option>
                <option value="landscaping">Landscaping</option>
                <option value="painting">Painting</option>
                <option value="other">Other</option>
              </select>
              {touched.tradeCategory && validateField('tradeCategory', tradeCategory) && (
                <p className="text-red-500 text-xs mt-1">{validateField('tradeCategory', tradeCategory)}</p>
              )}
            </div>

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
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                placeholder="Email Address"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              />
              {touched.email && validateField('email', email) && (
                <p className="text-red-500 text-xs mt-1">{validateField('email', email)}</p>
              )}
            </div>

            <div>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                required
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setLocalError("");
                  clearError();
                }}
                onBlur={() => setTouched(prev => ({ ...prev, phoneNumber: true }))}
                placeholder="Phone Number"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              />
              {touched.phoneNumber && validateField('phoneNumber', phoneNumber) && (
                <p className="text-red-500 text-xs mt-1">{validateField('phoneNumber', phoneNumber)}</p>
              )}
            </div>

            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLocalError("");
                  clearError();
                }}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                placeholder="Password"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              />
              {touched.password && validateField('password', password) && (
                <p className="text-red-500 text-xs mt-1">{validateField('password', password)}</p>
              )}
            </div>

            <div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setLocalError("");
                  clearError();
                }}
                onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                placeholder="Confirm Password"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              />
              {touched.confirmPassword && validateField('confirmPassword', confirmPassword) && (
                <p className="text-red-500 text-xs mt-1">{validateField('confirmPassword', confirmPassword)}</p>
              )}
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className={`w-full py-3 px-4 bg-black text-white font-medium rounded relative transition-opacity ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
                  }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="opacity-0">Create Account</span>
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
                  "Create Account"
                )}
              </button>
            </div>
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
