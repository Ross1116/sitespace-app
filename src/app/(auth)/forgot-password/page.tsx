import Link from "next/link";
import Image from "next/image";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      {/* Left Side - Visual Panel */}
      <div className="hidden lg:flex w-1/2 bg-navy relative flex-col p-16 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0 100 C 40 0 60 0 100 100 Z" fill="white" />
          </svg>
        </div>

        <div className="z-10">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/full-logo-dark.svg"
              alt="SiteSpace"
              width={160}
              height={48}
              className="h-10 brightness-0 invert"
              style={{ width: "auto" }}
              priority
            />
          </Link>
        </div>

        <div className="z-10 flex flex-1 items-center">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold leading-tight mb-5">
              Account recovery.
            </h1>
            <p className="text-slate-400 text-lg xl:text-xl max-w-lg leading-relaxed">
              Don&apos;t worry, it happens. Enter your email and we&apos;ll help
              you get back to managing your projects in no time.
            </p>
          </div>
        </div>

        <div className="z-10 text-sm text-slate-500">
          <p>© 2026 SiteSpace.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
