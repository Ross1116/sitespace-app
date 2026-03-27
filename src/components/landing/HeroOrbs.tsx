"use client";

import { useEffect, useRef } from "react";

export function HeroOrbs() {
  const refs = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  useEffect(() => {
    const wrappers = refs.current.filter(Boolean) as HTMLDivElement[];

    const onMove = (e: MouseEvent) => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 20;
      const my = (e.clientY / window.innerHeight - 0.5) * 20;
      wrappers.forEach((wrapper, i) => {
        const s = (i + 1) * 0.3;
        wrapper.style.transform = `translate(${mx * s}px, ${my * s}px)`;
      });
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  const orb =
    "w-full h-full rounded-full blur-[80px] opacity-30 animate-float pointer-events-none";

  return (
    <>
      <div
        ref={(el) => {
          refs.current[0] = el;
        }}
        className="absolute w-125 h-125 top-[10%] -right-[10%] will-change-transform pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div
          className={`${orb} bg-[linear-gradient(135deg,rgba(14,124,155,1),rgba(0,78,137,1))]`}
        />
      </div>
      <div
        ref={(el) => {
          refs.current[1] = el;
        }}
        className="absolute w-100 h-100 bottom-[20%] -left-[5%] will-change-transform pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div
          className={`${orb} bg-[linear-gradient(135deg,#f59e0b,rgba(245,158,11,0.7))]`}
          style={{ animationDelay: "7s" }}
        />
      </div>
      <div
        ref={(el) => {
          refs.current[2] = el;
        }}
        className="absolute w-87.5 h-87.5 top-1/2 left-1/2 will-change-transform pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div
          className={`${orb} bg-[linear-gradient(135deg,rgba(0,78,137,1),rgba(14,124,155,1))]`}
          style={{ animationDelay: "14s" }}
        />
      </div>
    </>
  );
}
