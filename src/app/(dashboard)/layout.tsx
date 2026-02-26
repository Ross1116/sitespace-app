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

  // Only block when we know the user is NOT authenticated.
  // While isLoading=true we render the full shell so SSR outputs it immediately.
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)]">
        <Loader2
          className="h-8 w-8 animate-spin text-[var(--teal)]"
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
