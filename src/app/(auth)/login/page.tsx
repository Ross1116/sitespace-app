"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(username, password);
    } catch (err) {
      setError(`Invalid credentials ${err}. Please try again.`);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Blue Section */}
      <div className="w-1/2 bg-amber-800 px-32 py-16 flex flex-col justify-between relative">
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
      <div className="w-1/2 bg-orange-50 p-16 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <h2 className="text-5xl font-bold mb-16">Sitespace</h2>

          {/* Welcome Text */}
          <h3 className="text-3xl font-bold mb-2">Welcome Back!</h3>

          {/* Create Account Text */}
          <p className="text-gray-600 mb-8">
            Don't have an account?{" "}
            <a href="#" className="text-blue-600 font-medium">
              Create a new account now
            </a>
            .
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
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
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-black text-white font-medium rounded"
              >
                Login Now
              </button>
            </div>

            {/* <div className="text-center text-gray-500 text-sm">
              Forgot password?{" "}
              <a href="#" className="text-black font-medium">
                Click here
              </a>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}
