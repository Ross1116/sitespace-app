"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/types";
import { AuthFormMotion } from "@/components/auth/AuthFormMotion";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus({ type: "loading" });

    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setStatus({
        type: "success",
        message: "If an account exists, we've sent instructions to your email.",
      });
    } catch (error: unknown) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(error, "Failed to send email."),
      });
    }
  };

  return (
    <AuthFormMotion direction={-1}>
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-navy transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />{" "}
            Back to Login
          </Link>
          <h2 className="text-3xl font-bold text-slate-900">
            Forgot Password?
          </h2>
          <p className="text-slate-500 mt-2">
            Enter your email for reset instructions.
          </p>
        </div>

        {status.type === "success" && (
          <Alert className="bg-emerald-50 border-emerald-100 text-emerald-800 rounded-xl animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        {status.type === "error" && (
          <Alert
            variant="destructive"
            className="bg-red-50 border-red-100 text-red-800 rounded-xl animate-in fade-in slide-in-from-top-2"
          >
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status.type === "loading" || status.type === "success"}
              className="h-12 border-slate-200 focus-visible:ring-navy rounded-xl text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-navy hover:bg-(--navy-hover) text-white font-bold text-base rounded-xl shadow-lg shadow-slate-900/10 transition-all disabled:opacity-70"
            disabled={status.type === "loading" || status.type === "success"}
          >
            {status.type === "loading" ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Sending...</span>
              </div>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </div>
    </AuthFormMotion>
  );
}
