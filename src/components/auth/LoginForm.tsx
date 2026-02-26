"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { reportError } from "@/lib/monitoring";
import { AuthFormMotion } from "@/components/auth/AuthFormMotion";
import { useAuthPreferencesStore } from "@/stores/authPreferencesStore";

export function LoginForm({ justRegistered }: { justRegistered: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, error, clearError, isAuthenticated } = useAuth();
  const rememberedEmail = useAuthPreferencesStore(
    (state) => state.rememberedEmail,
  );
  const setRememberedEmail = useAuthPreferencesStore(
    (state) => state.setRememberedEmail,
  );
  const clearRememberedEmail = useAuthPreferencesStore(
    (state) => state.clearRememberedEmail,
  );
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/home");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (rememberedEmail) {
      setEmail((currentEmail) => currentEmail || rememberedEmail);
      setRememberEmail(true);
    }
  }, [rememberedEmail]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (error) clearError();
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsSubmitting(true);
    try {
      await login(email, password);
      if (rememberEmail) {
        setRememberedEmail(email);
      } else {
        clearRememberedEmail();
      }
    } catch (err: unknown) {
      reportError(err, "Login page: login submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormMotion direction={1}>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center lg:text-left">
          <h2 className="text-3xl font-bold text-slate-900">Sign in</h2>
          <p className="text-slate-500 mt-2">Access your dashboard</p>
        </div>

        {justRegistered && (
          <div
            className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2"
            role="status"
          >
            <CheckCircle size={18} />
            Account created successfully! Please sign in.
          </div>
        )}

        {error && (
          <div
            className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm font-medium animate-in slide-in-from-top-2"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-semibold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="email"
              className="h-12 border-slate-200 focus-visible:ring-[var(--navy)] bg-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-slate-700 font-semibold">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[var(--navy)] hover:underline"
              >
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
                disabled={isSubmitting}
                autoComplete="current-password"
                className="h-12 pr-10 border-slate-200 focus-visible:ring-[var(--navy)] bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="remember"
              checked={rememberEmail}
              onCheckedChange={(checked) => setRememberEmail(checked as boolean)}
              className="border-slate-300 data-[state=checked]:bg-[var(--navy)] data-[state=checked]:border-[var(--navy)]"
            />
            <label
              htmlFor="remember"
              className="text-sm text-slate-600 font-medium cursor-pointer select-none"
            >
              Remember my email
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[var(--navy)] hover:bg-[var(--navy-hover)] text-white font-bold text-base transition-all shadow-lg shadow-slate-900/10 disabled:opacity-70"
            disabled={isSubmitting || !email.trim() || !password.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-[var(--navy)] hover:underline"
          >
            Create one here
          </Link>
        </p>
      </div>
    </AuthFormMotion>
  );
}
