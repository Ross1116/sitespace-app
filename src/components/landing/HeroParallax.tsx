"use client";

import { useEffect, useRef } from "react";

export function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 10;
      const my = (e.clientY / window.innerHeight - 0.5) * 10;
      el.style.transform = `translate(${mx}px, ${my}px)`;
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      className="animate-fade-in-up text-left max-md:text-center!"
      style={{ animationFillMode: "both" }}
    >
      <div ref={ref} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
