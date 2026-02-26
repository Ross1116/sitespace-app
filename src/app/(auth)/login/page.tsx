import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;
  const justRegistered = params.registered === "true";

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans">
      {/* Left Side - Navy Theme */}
      <div className="hidden lg:flex w-1/2 bg-[var(--navy)] relative flex-col p-16 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
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
            <h1 className="text-5xl font-bold leading-tight mb-5">
              Welcome back.
            </h1>
            <p className="text-slate-400 text-lg xl:text-xl max-w-lg leading-relaxed">
              Experience the future of construction logistics. Log in to access
              the booking calendar and asset management tools.
            </p>
          </div>
        </div>

        <div className="z-10 text-sm text-slate-500">
          <p>© 2026 SiteSpace.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <LoginForm justRegistered={justRegistered} />
      </div>
    </div>
  );
}
