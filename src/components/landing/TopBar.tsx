"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";

import { cn } from "@/lib/utils";
import { DemoRequestCTA } from "@/components/landing/ContactModal";

const NAV_ITEMS = [
  { href: "#features", label: "Product" },
  { href: "#lookahead", label: "Lookahead" },
  { href: "#calculator", label: "ROI" },
  { href: "#commitments", label: "Access" },
  { href: "#contact", label: "Contact" },
];

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
          "fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8",
        )}
        aria-label="Primary"
      >
        <div className="mx-auto max-w-screen-2xl">
          <div
            className={cn(
              "flex items-center justify-between rounded-[28px] border px-5 py-3.5 transition-all duration-300 sm:px-6 lg:px-8",
              isScrolled || isMenuOpen
                ? "border-white/30 bg-white/42 shadow-[0_20px_60px_rgba(11,17,32,0.14)] backdrop-blur-[26px]"
                : "border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(11,17,32,0.08)] backdrop-blur-0",
            )}
          >
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
            <div className="hidden items-center space-x-10 text-sm md:flex">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={NAV_LINK}
                  onClick={smoothScroll}
                >
                  {item.label}
                </a>
              ))}
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
                "z-100 flex cursor-pointer flex-col gap-1.25 rounded-full border p-2 transition-all duration-300 md:hidden",
                isScrolled || isMenuOpen
                  ? "border-white/30 bg-white/34 shadow-[0_10px_28px_rgba(11,17,32,0.12)] backdrop-blur-[22px]"
                  : "border-slate-200/80 bg-white shadow-[0_8px_22px_rgba(11,17,32,0.08)] backdrop-blur-0",
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
        {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block border-b border-slate-100 py-4 text-lg font-semibold text-[#0b1120] transition-all hover:pl-2.5 hover:text-[rgba(14,124,155,1)]"
              onClick={smoothScroll}
            >
              {item.label}
            </a>
        ))}
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
