"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { getApiErrorMessage } from "@/types";
import { AuthFormMotion } from "@/components/auth/AuthFormMotion";

const validatePassword = (pwd: string): string | null => {
  if (pwd.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
  return null;
};

export function SetPasswordForm({ initialToken }: { initialToken: string | null }) {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const hasScrubbed = useRef(false);

  const [token] = useState(initialToken);
  const [tokenValid] = useState(Boolean(initialToken));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  // Force logout so we don't set the wrong session's password
  useEffect(() => {
    if (isAuthenticated) logout();
  }, [isAuthenticated, logout]);

  // Scrub token from URL to reduce leakage
  useEffect(() => {
    if (hasScrubbed.current || !token) return;
    hasScrubbed.current = true;
    window.history.replaceState({}, "", window.location.pathname);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setStatus({ type: "error", message: passwordError });
      return;
    }
    setStatus({ type: "loading" });
    try {
      await api.post("/auth/reset-password", { token, password, confirm_password: confirmPassword });
      setStatus({ type: "success", message: "Account activated successfully! Redirecting..." });
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: unknown) {
      setStatus({ type: "error", message: getApiErrorMessage(error, "Invitation link expired or invalid.") });
    }
  };

  if (!tokenValid) {
    return (
      <AuthFormMotion direction={-1}>
        <div className="w-full max-w-md text-center">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Invalid Invitation</h2>
          <p className="text-slate-500 mb-8">
            This invitation link is invalid or has expired. Please ask the project manager to resend the invite.
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="w-full h-12 bg-[var(--navy)] text-white font-bold rounded-xl"
          >
            Go to Login
          </Button>
        </div>
      </AuthFormMotion>
    );
  }

  return (
    <AuthFormMotion direction={-1}>
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Activate Account</h2>
          <p className="text-slate-500 mt-2">Create your secure password.</p>
        </div>

        {status.type === "error" && (
          <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-800 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}
        {status.type === "success" && (
          <Alert className="bg-emerald-50 border-emerald-100 text-emerald-800 rounded-xl">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-semibold">Create Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, 1 Upper, 1 Lower, 1 Num"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={status.type === "loading"}
                className="h-12 pr-10 border-slate-200 focus-visible:ring-[var(--navy)] rounded-xl text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={status.type === "loading"}
              className="h-12 border-slate-200 focus-visible:ring-[var(--navy)] rounded-xl text-base"
            />
          </div>

          {password && (
            <>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${password.length >= 8 ? "bg-emerald-500" : "bg-slate-200"}`} />
                <div className={`h-1.5 rounded-full transition-all duration-300 ${/[A-Z]/.test(password) ? "bg-emerald-500" : "bg-slate-200"}`} />
                <div className={`h-1.5 rounded-full transition-all duration-300 ${/[a-z]/.test(password) ? "bg-emerald-500" : "bg-slate-200"}`} />
                <div className={`h-1.5 rounded-full transition-all duration-300 ${/[0-9]/.test(password) ? "bg-emerald-500" : "bg-slate-200"}`} />
              </div>
              <p className="mt-1 grid grid-cols-4 px-1 text-[10px] text-slate-400">
                <span className="text-left">Length</span>
                <span className="text-center">Upper</span>
                <span className="text-center">Lower</span>
                <span className="text-right">Number</span>
              </p>
            </>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 transition-all mt-4"
            disabled={status.type === "loading"}
          >
            {status.type === "loading" ? <Loader2 className="animate-spin h-5 w-5" /> : "Activate Account"}
          </Button>
        </form>
      </div>
    </AuthFormMotion>
  );
}
