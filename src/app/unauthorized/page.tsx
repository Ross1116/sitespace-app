'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-50">
      <div className="text-center px-4">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-6">
            <ShieldAlert className="h-16 w-16 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4">
          Access Denied
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 mb-2">
          You don&apos;t have permission to access this page.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Please contact your administrator if you believe this is an error.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-amber-600 text-sm font-medium rounded-md text-amber-600 bg-white hover:bg-amber-50 transition-colors"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <Link
            href="/home"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition-colors"
          >
            <Home size={18} />
            Return to Home
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-4 bg-white rounded-lg shadow-sm max-w-md mx-auto">
          <p className="text-xs text-gray-500">
            <strong>Error Code:</strong> 403 - Forbidden
          </p>
        </div>
      </div>
    </div>
  );
}