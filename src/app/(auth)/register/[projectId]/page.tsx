"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useParams } from "next/navigation";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tradeCategory, setTradeCategory] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const params = useParams();
  const project = params.projectId as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

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
    } catch (err) {
      setError(`Registration failed: ${err}. Please try again.`);
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

        {/* Background Pattern*/}
        <div className="absolute inset-0 opacity-10">
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
            <div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
              />
            </div>

            <div>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
              />
            </div>

            <div>
              <input
                id="tradeCategory"
                name="tradeCategory"
                type="text"
                required
                value={tradeCategory}
                onChange={(e) => setTradeCategory(e.target.value)}
                placeholder="Trade Category"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
              />
            </div>

            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
              />
            </div>

            <div>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone Number"
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

            <div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full p-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-gray-100 rounded-lg"
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-black text-white font-medium rounded"
              >
                Create Account
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
