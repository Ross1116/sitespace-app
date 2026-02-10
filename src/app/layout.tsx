import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import PostHogProvider from "./context/PostHogProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sitespace",
    template: "%s | Sitespace",
  },
  description: "Your all-in-one site scheduling app. Manage bookings, assets, and subcontractors in one place.",
  metadataBase: new URL("https://sitespace.com.au"),
  openGraph: {
    type: "website",
    siteName: "Sitespace",
    title: "Sitespace",
    description: "Your all-in-one site scheduling app. Manage bookings, assets, and subcontractors in one place.",
    url: "https://sitespace.com.au",
  },
  twitter: {
    card: "summary",
    title: "Sitespace",
    description: "Your all-in-one site scheduling app. Manage bookings, assets, and subcontractors in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[hsl(20,60%,99%)] text-slate-900`}
      >
        <SpeedInsights />
        <PostHogProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}