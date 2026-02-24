"use client";

import SideNav from "@/components/SideNav";
import { useAuth } from "../context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { isTvAllowedPath, isTvUser } from "@/lib/permissions";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (!isTvUser(user)) return;
    if (isTvAllowedPath(pathname)) return;
    router.replace("/multicalendar");
  }, [isAuthenticated, isLoading, pathname, router, user]);

  // Show spinner while auth is initializing (instead of blank flash)
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2
          className="h-8 w-8 animate-spin text-slate-400"
          aria-label="Loading"
          role="status"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--page-bg)]">
      <SideNav />
      <main className="flex-1 w-full relative overflow-x-hidden">
        <div className="pt-16 md:pt-0">{children}</div>
      </main>
    </div>
  );
}
