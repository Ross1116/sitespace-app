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
          fadeObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
    );

    const observeFadeEl = (el: HTMLElement) => {
      // Already revealed — skip
      if (el.hasAttribute("data-visible")) return;
      // Already scrolled past — reveal immediately without animation delay
      if (el.getBoundingClientRect().bottom < 0) {
        el.setAttribute("data-visible", "");
        return;
      }
      fadeObserver.observe(el);
    };

    root.querySelectorAll<HTMLElement>("[data-fade-in]").forEach(observeFadeEl);

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

    root.querySelectorAll<HTMLElement>("[data-progress]").forEach((el) => {
      progressObserver.observe(el);
    });

    /* ── MutationObserver: pick up data-fade-in nodes added after initial load ── */
    // Needed for dynamic() chunks (LookaheadDashboard, ShowcaseSection) that load
    // after ScrollAnimations has already run its initial querySelectorAll.
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.hasAttribute("data-fade-in")) observeFadeEl(node);
          node
            .querySelectorAll<HTMLElement>("[data-fade-in]")
            .forEach(observeFadeEl);
          // Also pick up any new progress elements
          if (node.hasAttribute("data-progress")) progressObserver.observe(node);
          node
            .querySelectorAll<HTMLElement>("[data-progress]")
            .forEach((el) => progressObserver.observe(el));
        }
      }
    });

    mutationObserver.observe(root, { childList: true, subtree: true });

    /* ── Smooth scroll for anchor links ── */
    const onAnchor = (e: Event) => {
      const a = e.currentTarget as HTMLAnchorElement;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("#")) return;
      const id = href.slice(1).trim();
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const anchors = root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    anchors.forEach((a) => {
      a.addEventListener("click", onAnchor);
    });

    return () => {
      fadeObserver.disconnect();
      progressObserver.disconnect();
      mutationObserver.disconnect();
      anchors.forEach((a) => {
        a.removeEventListener("click", onAnchor);
      });
    };
  }, []);

  return null;
}
