"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, error: authError, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (authError) setLocalError(authError);
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      if (rememberMe) localStorage.setItem("rememberedEmail", email);
      else localStorage.removeItem("rememberedEmail");
    } catch (err: any) {
      setLocalError(err?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans">
      {/* Left Side - Navy Theme */}
      <div className="hidden lg:flex w-1/2 bg-[#0B1120] relative flex-col justify-between p-16 text-white overflow-hidden">
        {/* Background Curves */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

        <div className="z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-[#0B1120]">
              <LayoutGrid size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">Sitespace</span>
          </div>

          <h1 className="text-6xl font-bold leading-tight mb-6">
            Welcome back <br /> to the Demo.
          </h1>
          
          <p className="text-slate-400 text-xl max-w-lg leading-relaxed">
            Experience the future of construction logistics. Log in to access the booking calendar and asset management tools.
          </p>
        </div>

        <div className="z-10 flex justify-between items-end text-sm text-slate-500">
          <p>© 2025 Sitespace Demo.</p>
          <p>v2.4.0-beta</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Sign in</h2>
            <p className="text-slate-500 mt-2">Access your dashboard</p>
          </div>

          {(localError || authError) && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm font-medium animate-in slide-in-from-top-2">
              {localError || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="demo@sitespace.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 border-slate-200 focus-visible:ring-[#0B1120] bg-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                <Link href="/forgot-password" className="text-xs font-semibold text-[#0B1120] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 pr-10 border-slate-200 focus-visible:ring-[#0B1120] bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-slate-300 data-[state=checked]:bg-[#0B1120] data-[state=checked]:border-[#0B1120]"
              />
              <label htmlFor="remember" className="text-sm text-slate-600 font-medium cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#0B1120] hover:bg-[#1a253a] text-white font-bold text-base transition-all shadow-lg shadow-slate-900/10"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-[#0B1120] hover:underline">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}