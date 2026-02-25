import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import PostHogProvider from "./context/PostHogProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GlobalNetworkLoadingBar from "@/components/ui/GlobalNetworkLoadingBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sitespace",
    template: "%s | Sitespace",
  },
  description:
    "Your all-in-one site scheduling app. Manage bookings, assets, and subcontractors in one place.",
  metadataBase: new URL("https://sitespace.com.au"),
  openGraph: {
    type: "website",
    siteName: "Sitespace",
    title: "Sitespace",
    description:
      "Your all-in-one site scheduling app. Manage bookings, assets, and subcontractors in one place.",
    url: "https://sitespace.com.au",
  },
  twitter: {
    card: "summary",
    title: "Sitespace",
    description:
      "Your all-in-one site scheduling app. Manage bookings, assets, and subcontractors in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/static/images/Lookaheaddash.jpeg"
          as="image"
          type="image/jpeg"
        />
        <link
          rel="preload"
          href="/full-logo-dark.svg"
          as="image"
          type="image/svg+xml"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--page-bg)] text-slate-900`}
      >
        <GlobalNetworkLoadingBar />
        <SpeedInsights />
        <PostHogProvider>
          <AuthProvider>{children}</AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
