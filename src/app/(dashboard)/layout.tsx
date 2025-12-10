"use client";

import SideNav from "@/components/SideNav";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Optional: Prevent flash of unstyled content while checking auth
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If your auth context has an 'isLoading' state, use that instead of this timeout/state
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, router]);

  // Prevent rendering protected content until check is complete
  if (isChecking && !isAuthenticated) return null; 

  return (
    // 1. Flex Container: Aligns the SideNav's internal "Ghost Spacer" next to <main>
    <div className="flex min-h-screen bg-[hsl(20,60%,99%)]"> 
      
      {/* 
        SideNav injects:
        - Static "Ghost Spacer" div (visible on desktop, pushes <main> right)
      */}
      <SideNav />

      {/* 
        2. Main Content: Takes remaining width.
        - w-full: Ensures it fills width
        - overflow-x-hidden: Prevents horizontal scroll if children are wide
      */}
      <main className="flex-1 w-full relative overflow-x-hidden">
        
        {/* Mobile Padding: Adds top space so content doesn't go under the menu button on mobile */}
        <div className="pt-16 md:pt-0">
          {children}
        </div>
        
      </main>
    </div>
  );
}