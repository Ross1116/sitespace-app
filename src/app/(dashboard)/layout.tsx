// "use client";
import SideNav from "@/components/SideNav";
// import { useAuth } from "../context/AuthContext";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const { isAuthenticated } = useAuth();
  // const router = useRouter();

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     router.push("/login");
  //   }
  // }, [isAuthenticated, router]);

  // if (!isAuthenticated) {
  //   return null;
  // }
  return (
    <>
      {/* Mobile SideNav (only visible on mobile) */}
      <div className="md:hidden">
        <SideNav />
      </div>

      {/* Desktop layout (hidden on mobile) */}
      <div className="hidden md:flex h-screen">
        <div className="w-16 flex-shrink-0 z-50 relative">
          <SideNav />
        </div>

        <div className="flex-1">{children}</div>
      </div>

      {/* Mobile content (only visible on mobile) */}
      <main className="md:hidden min-h-screen">
        <div className="pt-16">{children}</div>
      </main>
    </>
  );
}
