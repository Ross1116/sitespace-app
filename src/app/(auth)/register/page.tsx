"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await register(firstName, lastName, email, phone, password);
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      {/* Left Side */}
      <div className="hidden md:flex md:w-1/2 bg-amber-700 px-32 py-16 flex-col justify-between relative">
        <div className="z-10 mx-auto">
          <div className="text-white text-9xl my-12">*</div>
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
      </div>

      {/* Right Side */}
      <div className="w-full md:w-1/2 bg-orange-50 flex items-center justify-center min-h-screen md:p-16">
        <div className="max-w-md w-full px-6 py-12 md:p-0">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Sitespace</h2>
          <h3 className="text-2xl md:text-3xl font-bold mb-2">
            Create Account
          </h3>
          <p className="text-gray-600 mb-8">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 font-medium">
              Login here
            </a>
            .
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
            />

            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
            />

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
            />

            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
            />

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
            />

            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
            />

            <div className="pt-6">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-black text-white font-medium rounded"
              >
                Create Account
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
