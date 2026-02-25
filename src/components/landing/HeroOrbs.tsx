"use client";

import { useEffect, useRef } from "react";

export function HeroOrbs() {
  const refs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  useEffect(() => {
    const orbs = refs.current.filter(Boolean) as HTMLDivElement[];

    const onMove = (e: MouseEvent) => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 20;
      const my = (e.clientY / window.innerHeight - 0.5) * 20;
      orbs.forEach((orb, i) => {
        const s = (i + 1) * 0.3;
        orb.style.transform = `translate(${mx * s}px, ${my * s}px)`;
      });
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  const base =
    "absolute rounded-full blur-[80px] opacity-30 animate-float pointer-events-none will-change-transform -z-10";

  return (
    <>
      <div
        ref={(el) => {
          refs.current[0] = el;
        }}
        className={`${base} w-[500px] h-[500px] bg-[linear-gradient(135deg,rgba(14,124,155,1),rgba(0,78,137,1))] top-[10%] -right-[10%]`}
        aria-hidden="true"
      />
      <div
        ref={(el) => {
          refs.current[1] = el;
        }}
        className={`${base} w-[400px] h-[400px] bg-[linear-gradient(135deg,#f59e0b,rgba(245,158,11,0.7))] bottom-[20%] -left-[5%]`}
        style={{ animationDelay: "7s" }}
        aria-hidden="true"
      />
      <div
        ref={(el) => {
          refs.current[2] = el;
        }}
        className={`${base} w-[350px] h-[350px] bg-[linear-gradient(135deg,rgba(0,78,137,1),rgba(14,124,155,1))] top-1/2 left-1/2`}
        style={{ animationDelay: "14s" }}
        aria-hidden="true"
      />
    </>
  );
}
