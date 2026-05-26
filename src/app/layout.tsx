import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import PostHogProvider from "./context/PostHogProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GlobalNetworkLoadingBar from "@/components/ui/GlobalNetworkLoadingBar";
import { getServerUser } from "@/lib/serverAuth";

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
    default: "Sitespace | Predictive Construction Logistics",
    template: "%s | Sitespace",
  },
  description:
    "Sitespace turns construction programmes into shared-asset demand, booking coverage, capacity risk, and live site coordination.",
  metadataBase: new URL("https://sitespace.com.au"),
  openGraph: {
    type: "website",
    siteName: "Sitespace",
    title: "Sitespace | Predictive Construction Logistics",
    description:
      "Turn programmes into shared-asset demand, booking coverage, capacity risk, and live site coordination.",
    url: "https://sitespace.com.au",
  },
  twitter: {
    card: "summary",
    title: "Sitespace | Predictive Construction Logistics",
    description:
      "Turn programmes into shared-asset demand, booking coverage, capacity risk, and live site coordination.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getServerUser().catch(() => null);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-(--page-bg) text-slate-900`}
      >
        <GlobalNetworkLoadingBar />
        <SpeedInsights />
        <PostHogProvider>
          <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
