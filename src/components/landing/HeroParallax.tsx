"use client";

export function HeroParallax({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="animate-fade-in-up text-left max-md:text-center!"
      style={{ animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}
