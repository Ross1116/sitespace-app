"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";

import { cn } from "@/lib/utils";
import { DemoRequestCTA } from "@/components/landing/ContactModal";

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const toggleMenu = useCallback(() => setIsMenuOpen((v) => !v), []);

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const smoothScroll = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const href = e.currentTarget.getAttribute("href") ?? "";
      if (!href.startsWith("#")) return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      closeMenu();
    },
    [closeMenu],
  );

  const NAV_LINK = cn(
    "transition-colors link-underline",
    "text-[#0b1120] hover:text-[#0e7c9b]",
  );
  const HAMBURGER_BAR = cn(
    "block w-6.25 h-0.5 rounded-sm transition-all duration-300",
    "bg-[#0b1120]",
  );

  return (
    <>
      {/* Nav bar */}
      <nav
        className={cn(
          "fixed top-0 w-full z-50 backdrop-blur-xl transition-all duration-300",
          isScrolled || isMenuOpen
            ? "bg-white/[0.96] shadow-[0_1px_0_rgba(11,17,32,0.08),0_12px_34px_rgba(11,17,32,0.06)]"
            : "bg-white/95 shadow-[0_1px_0_rgba(11,17,32,0.08)]",
        )}
        aria-label="Primary"
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/full-logo.svg"
                alt="Sitespace"
                width={140}
                height={36}
                priority
                className="h-9 block"
                style={{ width: "auto" }}
              />
            </Link>

            {/* Desktop */}
            <div className="hidden md:flex items-center space-x-10 text-sm">
              <a href="#features" className={NAV_LINK} onClick={smoothScroll}>
                Features
              </a>
              <a href="#lookahead" className={NAV_LINK} onClick={smoothScroll}>
                Lookahead AI
              </a>
              <a href="#calculator" className={NAV_LINK} onClick={smoothScroll}>
                ROI Calculator
              </a>
              <a href="#benefits" className={NAV_LINK} onClick={smoothScroll}>
                Benefits
              </a>
              <a href="#contact" className={NAV_LINK} onClick={smoothScroll}>
                Contact
              </a>
              <Link
                href="/login"
                className={cn(
                  "transition-colors link-underline",
                  "text-[#0b1120] hover:text-[#0e7c9b]",
                )}
              >
                Sign In
              </Link>
              <DemoRequestCTA
                label="Book a Demo"
                className="cursor-pointer shine bg-amber-500 text-black rounded-full px-5 py-2.5 text-sm font-semibold inline-flex items-center justify-center hover:scale-[1.02] transition-transform"
              />
            </div>

            {/* Hamburger */}
            <button
              type="button"
              className={cn(
                "flex flex-col md:hidden cursor-pointer gap-1.25 z-100 bg-transparent border-none p-1.5",
                isMenuOpen && "hamburger-open",
              )}
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <span className={HAMBURGER_BAR} />
              <span className={HAMBURGER_BAR} />
              <span className={HAMBURGER_BAR} />
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      <button
        type="button"
        className={cn(
          "fixed inset-0 z-98 border-none bg-slate-950/30 transition-all duration-300",
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible",
        )}
        onClick={closeMenu}
        aria-label="Close menu"
      />

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed top-0 z-99 h-screen w-4/5 max-w-100 overflow-y-auto bg-white/[0.98] px-7.5 pb-7.5 pt-20 shadow-[-18px_0_50px_rgba(11,17,32,0.12)] backdrop-blur-2xl transition-[right] duration-400 ease-in-out",
          isMenuOpen ? "right-0" : "-right-full",
        )}
        aria-hidden={!isMenuOpen}
      >
        {["features", "lookahead", "calculator", "benefits", "contact"].map(
          (id) => (
            <a
              key={id}
              href={`#${id}`}
              className="block border-b border-slate-100 py-4 text-lg font-semibold text-[#0b1120] transition-all hover:pl-2.5 hover:text-[rgba(14,124,155,1)]"
              onClick={smoothScroll}
            >
              {id === "calculator"
                ? "ROI Calculator"
                : id.charAt(0).toUpperCase() + id.slice(1)}
              {id === "lookahead" ? " AI" : ""}
            </a>
          ),
        )}
        <Link
          href="/login"
          className="block border-b border-slate-100 py-4 text-lg font-semibold text-[#0b1120] transition-all hover:pl-2.5 hover:text-[rgba(14,124,155,1)]"
          onClick={closeMenu}
        >
          Sign In
        </Link>
        <DemoRequestCTA
          label="Book a Demo"
          className="cursor-pointer block mt-5 w-full text-center bg-amber-500 text-black rounded-full px-6 py-3 text-lg font-semibold hover:bg-amber-400 transition-colors"
        />
      </div>
    </>
  );
}
