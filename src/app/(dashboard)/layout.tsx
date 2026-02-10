"use client";

import SideNav from "@/components/SideNav";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show spinner while auth is initializing (instead of blank flash)
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-label="Loading" role="status" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--page-bg)]">
      <SideNav />
      <main className="flex-1 w-full relative overflow-x-hidden">
        <div className="pt-16 md:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
