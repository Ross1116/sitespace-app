"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { DemoRequestCTA } from "./ContactModal";
import styles from "./LandingPageOneToOne.module.css";

export default function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);

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
    let frameId = 0;

    const updateScrolledState = () => {
      const y = window.scrollY;
      setIsNavScrolled((current) => {
        if (!current && y > 72) return true;
        if (current && y < 28) return false;
        return current;
      });
    };

    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateScrolledState();
      });
    };

    updateScrolledState();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((value) => !value);

  return (
    <>
      <nav
        className={cn(styles.nav, isNavScrolled && styles.scrolled)}
        aria-label="Primary"
      >
        <div
          className={cn(
            styles.navSurface,
            isNavScrolled && styles.navSurfaceScrolled,
          )}
        >
          <div className="mx-auto max-w-screen-2xl px-6 py-4 lg:px-12">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/full-logo.svg"
                alt="SiteSpace"
                width={140}
                height={48}
                priority
                className={styles.logoMark}
              />
            </Link>

            <div className="hidden items-center space-x-10 text-sm md:flex">
              <a
                href="#features"
                className={cn(styles.navLink, styles.linkUnderline)}
              >
                Features
              </a>
              <a
                href="#lookahead"
                className={cn(styles.navLink, styles.linkUnderline)}
              >
                Lookahead AI
              </a>
              <a
                href="#benefits"
                className={cn(styles.navLink, styles.linkUnderline)}
              >
                Benefits
              </a>
              <a
                href="#contact"
                className={cn(styles.navLink, styles.linkUnderline)}
              >
                Contact
              </a>
              <Link
                href="/login"
                className={cn(styles.navLink, styles.linkUnderline)}
              >
                Sign In
              </Link>
              <DemoRequestCTA
                label="Book a Demo"
                className={cn(
                  styles.btnPrimary,
                  styles.shine,
                  "px-5 py-2.5 text-sm",
                )}
              />
            </div>

            <button
              type="button"
              className={cn(styles.hamburger, isMenuOpen && styles.active)}
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
        </div>
      </nav>

      <button
        type="button"
        className={cn(styles.menuOverlay, isMenuOpen && styles.active)}
        onClick={closeMenu}
        aria-label="Close menu"
      />

      <div
        className={cn(styles.mobileMenu, isMenuOpen && styles.active)}
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
      >
        <a
          href="#features"
          className={styles.mobileMenuLink}
          onClick={closeMenu}
        >
          Features
        </a>
        <a
          href="#lookahead"
          className={styles.mobileMenuLink}
          onClick={closeMenu}
        >
          Lookahead AI
        </a>
        <a
          href="#benefits"
          className={styles.mobileMenuLink}
          onClick={closeMenu}
        >
          Benefits
        </a>
        <a
          href="#contact"
          className={styles.mobileMenuLink}
          onClick={closeMenu}
        >
          Contact
        </a>
        <Link
          href="/login"
          className={styles.mobileMenuLink}
          onClick={closeMenu}
        >
          Sign In
        </Link>
        <div onClick={closeMenu}>
          <DemoRequestCTA
            label="Book a Demo"
            className={cn(styles.btnPrimary, styles.mobileMenuLink)}
          />
        </div>
      </div>
    </>
  );
}
