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

  const NAV_LINK =
    "text-gray-300 hover:text-white transition-colors link-underline";

  return (
    <>
      {/* Nav bar */}
      <nav
        className={cn(
          "fixed top-0 w-full z-50 backdrop-blur-xl transition-all duration-300",
          isScrolled
            ? "bg-black/95 shadow-[0_1px_0_rgba(255,255,255,0.1)]"
            : "bg-black/80",
        )}
        aria-label="Primary"
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/full-logo-dark.svg"
                alt="SiteSpace"
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
              <a href="#benefits" className={NAV_LINK} onClick={smoothScroll}>
                Benefits
              </a>
              <a href="#contact" className={NAV_LINK} onClick={smoothScroll}>
                Contact
              </a>
              <Link
                href="/login"
                className="text-gray-300 hover:text-white transition-colors link-underline"
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
              <span className="block w-6.25 h-0.5 bg-[rgb(245,245,247)] rounded-sm transition-all duration-300" />
              <span className="block w-6.25 h-0.5 bg-[rgb(245,245,247)] rounded-sm transition-all duration-300" />
              <span className="block w-6.25 h-0.5 bg-[rgb(245,245,247)] rounded-sm transition-all duration-300" />
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      <button
        type="button"
        className={cn(
          "fixed inset-0 bg-black/70 transition-all duration-300 z-98 border-none",
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible",
        )}
        onClick={closeMenu}
        aria-label="Close menu"
      />

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed top-0 w-4/5 max-w-100 h-screen bg-[rgba(10,10,20,0.98)] backdrop-blur-2xl transition-[right] duration-400 ease-in-out z-99 pt-20 px-7.5 pb-7.5 overflow-y-auto shadow-[-5px_0_30px_rgba(0,0,0,0.5)]",
          isMenuOpen ? "right-0" : "-right-full",
        )}
        aria-hidden={!isMenuOpen}
      >
        {["features", "lookahead", "benefits", "contact"].map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="block py-4 text-[rgb(245,245,247)] text-lg font-semibold border-b border-white/10 hover:text-[rgba(14,124,155,1)] hover:pl-2.5 transition-all"
            onClick={smoothScroll}
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
            {id === "lookahead" ? " AI" : ""}
          </a>
        ))}
        <Link
          href="/login"
          className="block py-4 text-[rgb(245,245,247)] text-lg font-semibold border-b border-white/10 hover:text-[rgba(14,124,155,1)] hover:pl-2.5 transition-all"
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
