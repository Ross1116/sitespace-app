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
  { ssr: false },
);

export const ShowcaseSection = dynamic(
  () => import("./ShowcaseSection").then((m) => m.ShowcaseSection),
  { ssr: false },
);
