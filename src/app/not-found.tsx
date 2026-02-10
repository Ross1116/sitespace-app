import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(20,60%,99%)]">
      <div className="text-center p-8 max-w-md">
        <p className="text-7xl font-extrabold text-slate-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-slate-800 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/home"
          className="inline-flex items-center px-5 py-2.5 bg-[#0B1120] text-white text-sm font-medium rounded-lg hover:bg-[#1a253a] transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
