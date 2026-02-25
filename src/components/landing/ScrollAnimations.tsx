"use client";

import { useEffect } from "react";

export function ScrollAnimations() {
  useEffect(() => {
    const root = document.getElementById("landing-root");
    if (!root) return;

    /* ── Fade-in observer ── */
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).setAttribute("data-visible", "");
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
    );

    root
      .querySelectorAll<HTMLElement>("[data-fade-in]")
      .forEach((el) => fadeObserver.observe(el));

    /* ── Progress bar observer ── */
    const progressObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const fills = (
            entry.target as HTMLElement
          ).querySelectorAll<HTMLElement>("[data-progress-fill]");
          fills.forEach((fill) => {
            const w = fill.getAttribute("data-width") ?? "0%";
            fill.style.width = "0%";
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                fill.style.width = w;
              });
            });
          });
        }
      },
      { threshold: 0.5 },
    );

    root
      .querySelectorAll<HTMLElement>("[data-progress]")
      .forEach((el) => progressObserver.observe(el));

    /* ── Smooth scroll for anchor links ── */
    const onAnchor = (e: Event) => {
      const a = e.currentTarget as HTMLAnchorElement;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("#")) return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const anchors = root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    anchors.forEach((a) => a.addEventListener("click", onAnchor));

    return () => {
      fadeObserver.disconnect();
      progressObserver.disconnect();
      anchors.forEach((a) => a.removeEventListener("click", onAnchor));
    };
  }, []);

  return null;
}
