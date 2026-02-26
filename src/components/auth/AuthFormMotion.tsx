"use client";

import { m, LazyMotion, domAnimation } from "framer-motion";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

// Persists across client-side navigations within the same session.
// false on first page load → no animation (form visible from SSR HTML).
// true on all subsequent client navigations → animation plays.
let hasHydrated = false;

export function AuthFormMotion({
  children,
  direction = 1,
}: {
  children: ReactNode;
  /** 1 = enter from right (back to login), -1 = enter from left (forward to other pages) */
  direction?: 1 | -1;
}) {
  const [shouldAnimate] = useState(() => hasHydrated);

  useEffect(() => {
    hasHydrated = true;
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        className="w-full flex justify-center"
        initial={
          shouldAnimate ? { opacity: 0, x: 28 * direction, scale: 0.98 } : false
        }
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.7 }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
