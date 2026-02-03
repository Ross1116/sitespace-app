"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      // Pass as object to match new AuthContext signature
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0 0 C 50 100 80 100 100 0 Z" fill="white" />
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
            Start your free <br /> demo trial.
          </h1>

          <p className="text-slate-400 text-xl max-w-lg leading-relaxed">
            Join the platform managing complex construction logistics. Test the
            features and see the efficiency gains.
          </p>
        </div>

        <div className="z-10 text-sm text-slate-500">
          <p>© 2025 Sitespace Demo.</p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 my-auto">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">
              Create Account
            </h2>
            <p className="text-slate-500 mt-2">
              Get started with the Sitespace Demo
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm font-medium animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  onChange={handleChange}
                  required
                  className="h-11 border-slate-200 focus-visible:ring-[#0B1120]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  onChange={handleChange}
                  required
                  className="h-11 border-slate-200 focus-visible:ring-[#0B1120]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                onChange={handleChange}
                required
                className="h-11 border-slate-200 focus-visible:ring-[#0B1120]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                onChange={handleChange}
                required
                className="h-11 border-slate-200 focus-visible:ring-[#0B1120]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                  className="h-11 pr-10 border-slate-200 focus-visible:ring-[#0B1120]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                onChange={handleChange}
                required
                className="h-11 border-slate-200 focus-visible:ring-[#0B1120]"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#0B1120] hover:bg-[#1a253a] text-white font-bold text-base transition-all mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#0B1120] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
