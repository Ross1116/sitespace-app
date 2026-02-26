import Link from "next/link";
import Image from "next/image";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token)
    ? (params.token[0] ?? null)
    : (params.token ?? null);

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      {/* Left Side - Security Panel */}
      <div className="hidden lg:flex w-1/2 bg-[var(--navy)] relative flex-col p-16 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect x="0" y="0" width="100" height="100" fill="transparent" />
            <path d="M0 0 L100 100 M100 0 L0 100" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="z-10">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/full-logo-dark.svg"
              alt="SiteSpace"
              width={160}
              height={48}
              className="h-10 w-auto brightness-0 invert"
              priority
            />
          </Link>
        </div>

        <div className="z-10 flex flex-1 items-center">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold leading-tight mb-5">Secure your account.</h1>
            <p className="text-slate-400 text-lg xl:text-xl max-w-lg leading-relaxed">
              Create a strong password to protect your account.
            </p>
          </div>
        </div>

        <div className="z-10 text-sm text-slate-500">
          <p>© 2026 SiteSpace.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <ResetPasswordForm initialToken={token} />
      </div>
    </div>
  );
}
