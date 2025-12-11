"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message?: string }>({ type: 'idle' });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus({ type: 'loading' });

    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setStatus({ type: 'success', message: "If an account exists, we've sent instructions to your email." });
      // Optional: Redirect after delay
      // setTimeout(() => router.push("/login"), 5000); 
    } catch (error: any) {
      setStatus({ type: 'error', message: error.response?.data?.detail || "Failed to send email." });
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      
      {/* Left Side - Visual Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0B1120] relative flex-col justify-between p-16 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 C 40 0 60 0 100 100 Z" fill="white" />
           </svg>
        </div>

        <div className="z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-[#0B1120]">
              <KeyRound size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">Sitespace</span>
          </div>

          <h1 className="text-6xl font-bold leading-tight mb-6">
            Account <br /> Recovery.
          </h1>
          
          <p className="text-slate-400 text-xl max-w-lg leading-relaxed">
            Don't worry, it happens. Enter your email and we'll help you get back to managing your projects in no time.
          </p>
        </div>

        <div className="z-10 text-sm text-slate-500">
          <p>© 2025 Sitespace Demo Environment.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          <div>
            <Link href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#0B1120] transition-colors mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>
            <h2 className="text-3xl font-bold text-slate-900">Forgot Password?</h2>
            <p className="text-slate-500 mt-2">Enter your email for reset instructions.</p>
          </div>

          {status.type === 'success' && (
            <Alert className="bg-emerald-50 border-emerald-100 text-emerald-800 rounded-xl animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          {status.type === 'error' && (
            <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-800 rounded-xl animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={status.type === 'loading' || status.type === 'success'} 
                className="h-12 border-slate-200 focus-visible:ring-[#0B1120] text-base" 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#0B1120] hover:bg-[#1a253a] text-white font-bold text-base shadow-lg shadow-slate-900/10 transition-all" 
              disabled={status.type === 'loading' || status.type === 'success'}
            >
              {status.type === 'loading' ? <Loader2 className="animate-spin h-5 w-5" /> : "Send Reset Link"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}