"use client";

import dynamic from "next/dynamic";

// ssr: false must live inside a client module — imported by the server LandingPage
export const ScrollAnimations = dynamic(
  () => import("./ScrollAnimations").then((m) => m.ScrollAnimations),
  { ssr: false },
);

export const HeroOrbs = dynamic(
  () => import("./HeroOrbs").then((m) => m.HeroOrbs),
  { ssr: false },
);

export const LookaheadDashboard = dynamic(
  () => import("./LookaheadPreview").then((m) => m.LookaheadDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse h-[420px]" />
    ),
  },
);

export const ShowcaseSection = dynamic(
  () => import("./ShowcaseSection").then((m) => m.ShowcaseSection),
  {
    ssr: false,
    loading: () => (
      <section className="px-6 py-16 md:py-[120px]">
        <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse h-[500px]" />
      </section>
    ),
  },
);

export { DemoRequestCTA, DemoModalProvider } from "./ContactModal";
