"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

import { cn } from "@/lib/utils";

import styles from "./LandingPageOneToOne.module.css";

type ShowcaseView = "desktop" | "mobile" | "combined";

export default function LandingPageOneToOne() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [showcaseView, setShowcaseView] = useState<ShowcaseView>("desktop");

  const year = useMemo(() => new Date().getFullYear(), []);

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
    const onScroll = () => {
      setIsNavScrolled(window.scrollY > 50);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const fadeTargets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-fade-in]"),
    );

    const featureCardTargets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-feature-card]"),
    );

    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).classList.add(styles.visible);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
    );

    fadeTargets.forEach((el) => fadeObserver.observe(el));
    featureCardTargets.forEach((el) => fadeObserver.observe(el));

    const progressTargets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-progress]"),
    );

    const progressObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const fills = Array.from(
            (entry.target as HTMLElement).querySelectorAll<HTMLElement>(
              "[data-progress-fill]",
            ),
          );

          fills.forEach((fill) => {
            const width = fill.getAttribute("data-width") ?? "0%";
            fill.style.width = "0%";
            window.setTimeout(() => {
              fill.style.width = width;
            }, 100);
          });
        });
      },
      { threshold: 0.5 },
    );

    progressTargets.forEach((el) => progressObserver.observe(el));

    const onMouseMove = (e: MouseEvent) => {
      const mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
      const mouseY = (e.clientY / window.innerHeight - 0.5) * 20;

      const heroParallax = root.querySelector<HTMLElement>(
        "[data-hero-parallax]",
      );
      if (heroParallax) {
        heroParallax.style.transform = `translate(${mouseX * 0.5}px, ${
          mouseY * 0.5
        }px)`;
      }

      const orbs = root.querySelectorAll<HTMLElement>("[data-orb]");
      orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.3;
        orb.style.transform = `translate(${mouseX * speed}px, ${
          mouseY * speed
        }px)`;
      });
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });

    const onAnchorClick = (e: Event) => {
      const target = e.currentTarget as HTMLAnchorElement | null;
      if (!target) return;

      const href = target.getAttribute("href") ?? "";
      if (!href.startsWith("#")) return;

      const el = root.querySelector(href);
      if (!el) return;

      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const anchorLinks = Array.from(
      root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
    );
    anchorLinks.forEach((a) => a.addEventListener("click", onAnchorClick));

    return () => {
      fadeObserver.disconnect();
      progressObserver.disconnect();
      document.removeEventListener("mousemove", onMouseMove);
      anchorLinks.forEach((a) => a.removeEventListener("click", onAnchorClick));
    };
  }, []);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((v) => !v);

  return (
    <div ref={rootRef} className={styles.root}>
      {/* Navigation */}
      <nav
        className={cn(styles.nav, isNavScrolled && styles.scrolled)}
        aria-label="Primary"
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/full-logo-dark.svg"
                alt="SiteSpace"
                width={140}
                height={48}
                priority
                className={styles.logoMark}
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-10 text-sm">
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
              <a
                href="#demo"
                className={cn(styles.btnPrimary, styles.shine)}
                style={{ padding: "10px 20px", fontSize: 14 }}
              >
                Book a Demo
              </a>
            </div>

            {/* Hamburger */}
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
      </nav>

      {/* Mobile Menu Overlay */}
      <button
        type="button"
        className={cn(styles.menuOverlay, isMenuOpen && styles.active)}
        onClick={closeMenu}
        aria-label="Close menu"
      />

      {/* Mobile Menu */}
      <div
        className={cn(styles.mobileMenu, isMenuOpen && styles.active)}
        aria-hidden={!isMenuOpen}
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
        <a
          href="#demo"
          className={cn(styles.btnPrimary, styles.mobileMenuLink)}
          onClick={closeMenu}
        >
          Book a Demo
        </a>
      </div>

      {/* Hero */}
      <section className={cn(styles.heroSection, styles.gridBg)}>
        <div className={cn(styles.floatingOrb, styles.orb1)} data-orb />
        <div className={cn(styles.floatingOrb, styles.orb2)} data-orb />
        <div className={cn(styles.floatingOrb, styles.orb3)} data-orb />
        <div className={styles.parallaxBg} aria-hidden="true" />

        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              className={cn(styles.heroContent, "text-left")}
              data-hero-parallax
            >
              <div className={cn(styles.badge, "mb-6")}>
                <span>🚀 Introducing AI-Powered Lookahead Planning</span>
              </div>
              <h1 className={cn(styles.giantText, "mb-6")}>
                The future of
                <br />
                construction
              </h1>
              <p
                className="text-xl md:text-2xl text-gray-400 max-w-3xl mb-10"
                style={{ fontWeight: 400 }}
              >
                Program driven predictive logistics intelligence tool
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#demo" className={cn(styles.btnPrimary, styles.shine)}>
                  Book a Demo
                </a>
                <button
                  type="button"
                  className={cn(styles.btnSecondary, styles.shine)}
                >
                  Watch Video
                </button>
              </div>
            </div>

            <div
              className={cn(styles.heroContent, "relative")}
              style={{ transitionDelay: "0.2s" }}
            >
              <div className="relative">
                <div
                  className={cn(
                    styles.desktopFrame,
                    styles.heroDesktopTilt,
                    styles.appleCard,
                    styles.shine,
                  )}
                >
                  <div className={styles.desktopFrameHeader}>
                    <div className={styles.desktopFrameDots}>
                      <div className={styles.desktopFrameDot} />
                      <div className={styles.desktopFrameDot} />
                      <div className={styles.desktopFrameDot} />
                    </div>
                  </div>
                  <img
                    src="/static/images/Lookaheaddash.jpeg"
                    alt="SiteSpace Lookahead dashboard"
                    className="block w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.sectionSpacing}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className={cn(styles.fadeIn, "text-center")} data-fade-in>
              <div className={styles.statNumber}>85%</div>
              <div className="text-gray-500 text-sm md:text-base mt-2">
                Fewer conflicts
              </div>
            </div>
            <div
              className={cn(styles.fadeIn, "text-center")}
              data-fade-in
              style={{ transitionDelay: "0.1s" }}
            >
              <div className={styles.statNumber}>2-4</div>
              <div className="text-gray-500 text-sm md:text-base mt-2">
                Weeks advance notice
              </div>
            </div>
            <div
              className={cn(styles.fadeIn, "text-center")}
              data-fade-in
              style={{ transitionDelay: "0.2s" }}
            >
              <div className={styles.statNumber}>60%</div>
              <div className="text-gray-500 text-sm md:text-base mt-2">
                Time saved
              </div>
            </div>
            <div
              className={cn(styles.fadeIn, "text-center")}
              data-fade-in
              style={{ transitionDelay: "0.3s" }}
            >
              <div className={styles.statNumber}>100%</div>
              <div className="text-gray-500 text-sm md:text-base mt-2">
                Audit trail
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1 */}
      <section
        id="features"
        className={cn(styles.scrollSection, styles.bgDarkSubtle)}
      >
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className={styles.fadeIn} data-fade-in>
            <h2 className={cn(styles.largeText, "mb-6")}>
              Know when to book any asset
              <br />
              <span className={styles.gradientText}>in seconds</span>
            </h2>
            <p
              className="text-xl text-gray-400 mb-8"
              style={{ fontWeight: 400, lineHeight: 1.5 }}
            >
              Tower cranes, loading bays, hoists. Subcontractors book instantly.
              Managers approve with one tap. No email chains. No confusion.
            </p>
            <div className="space-y-3">
              <CheckItem>One-click booking requests</CheckItem>
              <CheckItem>Instant approval workflows</CheckItem>
              <CheckItem>Real-time notifications</CheckItem>
            </div>
          </div>
          <div
            className={styles.fadeIn}
            data-fade-in
            style={{ transitionDelay: "0.2s" }}
          >
            <div
              className={cn(
                styles.desktopFrame,
                styles.featureOneFrame,
                styles.appleCard,
                styles.shine,
              )}
            >
              <div className={styles.desktopFrameHeader}>
                <div className={styles.desktopFrameDots}>
                  <div className={styles.desktopFrameDot} />
                  <div className={styles.desktopFrameDot} />
                  <div className={styles.desktopFrameDot} />
                </div>
              </div>
              <img
                src="/static/images/dashtwo.jpeg"
                alt="SiteSpace dashboard showing bookings and assets"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2 */}
      <section className={cn(styles.scrollSection, styles.bgGray950)}>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className={cn(styles.fadeIn, "order-2 md:order-1")} data-fade-in>
            <div
              className={cn(
                styles.desktopFrame,
                styles.appleCard,
                styles.shine,
              )}
            >
              <div className={styles.desktopFrameHeader}>
                <div className={styles.desktopFrameDots}>
                  <div className={styles.desktopFrameDot} />
                  <div className={styles.desktopFrameDot} />
                  <div className={styles.desktopFrameDot} />
                </div>
              </div>
              <img
                src="/static/images/cal.jpg"
                alt="SiteSpace subcontractors management dashboard"
              />
            </div>
          </div>
          <div className={cn(styles.fadeIn, "order-1 md:order-2")} data-fade-in>
            <h2 className={cn(styles.largeText, "mb-6")}>
              Eliminate
              <br />
              <span className={styles.gradientText}>double bookings</span>
            </h2>
            <p
              className="text-xl text-gray-400 mb-8"
              style={{ fontWeight: 400, lineHeight: 1.5 }}
            >
              Our AI detects scheduling conflicts before they happen. No more
              delivery clashes. No more crane congestion. Just smooth
              operations.
            </p>
            <div className="space-y-3">
              <CheckItem>Intelligent conflict prevention</CheckItem>
              <CheckItem>Real-time availability tracking</CheckItem>
              <CheckItem>Automated clash resolution</CheckItem>
            </div>
          </div>
        </div>
      </section>

      {/* Lookahead Hero */}
      <section
        id="lookahead"
        className={styles.scrollSection}
        style={{
          background:
            "linear-gradient(180deg, var(--lp-bg-0) 0%, var(--lp-bg-1) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className={cn(styles.fadeIn, "mb-16")} data-fade-in>
            <div className={cn(styles.badge, "mb-8")}>✨ Powered by AI</div>
            <h2 className={cn(styles.giantText, "mb-8")}>
              Lookahead
              <br />
              Planning
            </h2>
            <p
              className="text-2xl md:text-3xl text-gray-400 max-w-4xl mx-auto"
              style={{ fontWeight: 400, lineHeight: 1.4 }}
            >
              Connect your construction program to intelligent forecasting. Get
              alerts 2-6 weeks in advance. Plan smarter, not harder.
            </p>
          </div>
        </div>
      </section>

      {/* Lookahead Dashboard */}
      <section className={styles.sectionSpacing}>
        <div className="max-w-6xl mx-auto px-6">
          <div
            className={cn(
              styles.dashboardMockup,
              styles.fadeIn,
              styles.glowBlue,
              styles.glassCard,
              styles.appleCard,
              styles.shine,
            )}
            data-fade-in
            data-progress
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  Lookahead Dashboard
                </div>
                <div className="text-2xl font-semibold">2-Week Forecast</div>
              </div>
              <div
                className={styles.badge}
                style={{
                  background: "rgba(34, 197, 94, 0.2)",
                  borderColor: "rgba(34, 197, 94, 0.3)",
                }}
              >
                <span style={{ color: "#4ade80" }}>● Live</span>
              </div>
            </div>

            <div className="grid gap-6 mb-8">
              <ForecastCard
                title="Tower Crane Demand"
                badgeLabel="High"
                badgeStyle={{
                  background:
                    "color-mix(in oklab, var(--lp-accent) 18%, transparent)",
                  borderColor:
                    "color-mix(in oklab, var(--lp-accent) 35%, transparent)",
                  color: "var(--lp-accent)",
                }}
                fillStyle={{
                  width: "85%",
                  background:
                    "linear-gradient(90deg, color-mix(in oklab, var(--lp-accent) 65%, white 35%) 0%, var(--lp-accent) 55%, color-mix(in oklab, var(--lp-accent) 70%, black 30%) 100%)",
                }}
                fillWidth="85%"
                subtitle="Week of Feb 17-21"
              />

              <ForecastCard
                title="Loading Bay Usage"
                badgeLabel="Normal"
                badgeStyle={{
                  background: "rgba(34, 197, 94, 0.2)",
                  borderColor: "rgba(34, 197, 94, 0.3)",
                  color: "#4ade80",
                }}
                fillStyle={{
                  width: "45%",
                  background:
                    "linear-gradient(90deg, rgba(74, 222, 128, 1) 0%, rgba(59, 130, 246, 1) 100%)",
                }}
                fillWidth="45%"
                subtitle="Week of Feb 17-21"
              />

              <ForecastCard
                title="Hoist Bookings"
                badgeLabel="Low"
                badgeStyle={{
                  background: "rgba(59, 130, 246, 0.2)",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                  color: "#60a5fa",
                }}
                fillStyle={{
                  width: "25%",
                  background:
                    "linear-gradient(90deg, rgba(96, 165, 250, 1) 0%, rgba(129, 140, 248, 1) 100%)",
                }}
                fillWidth="25%"
                subtitle="Week of Feb 17-21"
              />
            </div>

            <div
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                padding: 20,
                borderRadius: 12,
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <div className="flex items-start gap-4">
                <svg
                  className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-blue-200">
                  <div className="font-medium mb-1">Planning Alert</div>
                  <div className="text-sm">
                    Facade installation starting in 3 weeks. Consider booking
                    crane slots now to avoid congestion.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lookahead Features */}
      <section className={styles.sectionSpacing}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <FeatureBlurb
              title={
                <>
                  Program
                  <br />
                  Integration
                </>
              }
              delay="0s"
            >
              Upload from Primavera P6, MS Project, or PDF. We analyze upcoming
              milestones and identify asset needs automatically.
            </FeatureBlurb>
            <FeatureBlurb
              title={
                <>
                  Smart
                  <br />
                  Forecasting
                </>
              }
              delay="0.1s"
            >
              AI identifies which activities need cranes, bays, or hoists.
              Predicts congestion weeks in advance, not after it happens.
            </FeatureBlurb>
            <FeatureBlurb
              title={
                <>
                  Proactive
                  <br />
                  Alerts
                </>
              }
              delay="0.2s"
            >
              Neutral, actionable notifications. Weekly digests keep teams
              informed without overwhelming them.
            </FeatureBlurb>
            <FeatureBlurb
              title={
                <>
                  Zero
                  <br />
                  Risk
                </>
              }
              delay="0.3s"
            >
              Read-only program access. No edits, no overrides. Complete audit
              trail for compliance and claims defense.
            </FeatureBlurb>
          </div>
        </div>
      </section>

      {/* Mobile Experience (disabled)
      <section
        className={styles.sectionSpacing}
        style={{
          background:
            "linear-gradient(180deg, var(--lp-bg-0) 0%, var(--lp-bg-1) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className={cn(styles.fadeIn, "text-center mb-16")} data-fade-in>
            <div className={cn(styles.badge, "mb-6")}>📱 Mobile Experience</div>
            <h2 className={cn(styles.largeText, "mb-6")}>
              Everything you need.
              <br />
              <span className={styles.gradientText}>Right in your pocket.</span>
            </h2>
            <p
              className="text-xl text-gray-400 max-w-3xl mx-auto"
              style={{ fontWeight: 400 }}
            >
              Manage your construction site from anywhere with our intuitive
              mobile app.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <PhoneShot
              delay="0s"
              title="Real-time Dashboard"
              description="See all active bookings, assets, and subcontractors at a glance"
              src="/static/images/dash.png"
              alt="SiteSpace mobile dashboard"
            />
            <PhoneShot
              delay="0.15s"
              title="Asset Tracking"
              description="Monitor equipment status, location, and availability in real-time"
              src="/static/images/ASSETS.png"
              alt="SiteSpace assets management"
            />
            <PhoneShot
              delay="0.3s"
              title="Smart Calendar"
              description="Book assets, view schedules, and avoid conflicts effortlessly"
              src="/static/images/Calender.png"
              alt="SiteSpace calendar interface"
            />
          </div>

          <div
            className={cn(
              "mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-8",
              styles.fadeIn,
            )}
            data-fade-in
            style={{ transitionDelay: "0.4s" }}
          >
            <HighlightCard
              title="iOS & Android"
              iconWrapClassName="bg-blue-500/20"
              icon={
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              }
            >
              Native apps for seamless performance
            </HighlightCard>

            <HighlightCard
              title="Offline Mode"
              iconWrapClassName="bg-green-500/20"
              icon={
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
            >
              Work anywhere, sync when connected
            </HighlightCard>

            <HighlightCard
              title="Push Alerts"
              iconWrapClassName="bg-purple-500/20"
              icon={
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              }
            >
              Real-time notifications on bookings
            </HighlightCard>

            <HighlightCard
              title="Secure Access"
              iconWrapClassName=""
              iconWrapStyle={{
                background:
                  "color-mix(in oklab, var(--lp-accent) 20%, transparent)",
              }}
              icon={
                <svg
                  className="w-6 h-6"
                  style={{ color: "var(--lp-accent)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            >
              Biometric login & encryption
            </HighlightCard>
          </div>
        </div>
      </section>
      */}

      {/* Coming Soon */}
      <section
        className={styles.sectionSpacing}
        style={{
          background:
            "linear-gradient(180deg, var(--lp-bg-1) 0%, var(--lp-bg-0) 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className={styles.fadeIn} data-fade-in>
            <div className={cn(styles.badge, "mb-8")}>🔮 Coming Soon</div>
            <h2 className={cn(styles.largeText, "mb-8")}>
              Live program sync.
              <br />
              <span className={styles.gradientText}>Zero manual updates.</span>
            </h2>
            <p
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12"
              style={{ fontWeight: 400, lineHeight: 1.5 }}
            >
              When the construction program changes, bookings adapt
              automatically. Everyone stays aligned in real-time.
            </p>
            <div className="flex flex-wrap gap-6 justify-center text-gray-400">
              <CompactCheck>Auto-detection</CompactCheck>
              <CompactCheck>Smart resolution</CompactCheck>
              <CompactCheck>Instant sync</CompactCheck>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section
        id="benefits"
        className={styles.sectionSpacing}
        style={{
          background:
            "linear-gradient(180deg, var(--lp-bg-0) 0%, var(--lp-bg-1) 50%, var(--lp-bg-0) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className={cn(styles.fadeIn, "text-center mb-20")} data-fade-in>
            <h2 className={cn(styles.largeText, "mb-6")}>
              Built for everyone
              <br />
              <span className={styles.gradientText}>on site</span>
            </h2>
          </div>

          <div className="mx-auto grid w-full max-w-5xl px-2 md:px-6 md:grid-cols-2 gap-16">
            <div className={styles.fadeIn} data-fade-in>
              <h3 className="text-3xl font-semibold mb-8">
                For Subcontractors
              </h3>
              <div className="space-y-4">
                <BenefitItem
                  title="Book assets in under 60 seconds"
                  description="No complex forms. Just simple, fast bookings."
                />
                <BenefitItem
                  title="Get advance notice"
                  description="Plan 2-4 weeks ahead before demand peaks."
                />
                <BenefitItem
                  title="Avoid delays and conflicts"
                  description="No more delivery clashes or site access issues."
                />
              </div>
            </div>

            <div
              className={styles.fadeIn}
              data-fade-in
              style={{ transitionDelay: "0.2s" }}
            >
              <h3 className="text-3xl font-semibold mb-8">
                For Project Managers
              </h3>
              <div className="space-y-4">
                <BenefitItem
                  title="Spot congestion early"
                  description="See bottlenecks weeks in advance, not after."
                />
                <BenefitItem
                  title="Complete audit trail"
                  description="Immutable logs for claims defense and compliance."
                />
                <BenefitItem
                  title="Zero legal risk"
                  description="Read-only program access. No edits, no liability."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section
        className={styles.sectionSpacing}
        style={{
          background:
            "linear-gradient(180deg, var(--lp-bg-0) 0%, var(--lp-bg-1) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className={cn(styles.fadeIn, "text-center mb-16")} data-fade-in>
            <div className={cn(styles.badge, "mb-6")}>
              💼 Full Platform Overview
            </div>
            <h2 className={cn(styles.largeText, "mb-6")}>
              Explore SiteSpace
              <br />
              <span className={styles.gradientText}>in action</span>
            </h2>
            <p
              className="text-xl text-gray-400 max-w-3xl mx-auto"
              style={{ fontWeight: 400 }}
            >
              See how teams manage construction projects across desktop and
              mobile
            </p>
          </div>

          <div
            className={cn(styles.showcaseTabs, styles.fadeIn)}
            data-fade-in
            style={{ transitionDelay: "0.2s" }}
            role="tablist"
            aria-label="Product showcase"
          >
            <button
              type="button"
              className={cn(
                styles.showcaseTab,
                showcaseView === "desktop" && styles.active,
              )}
              onClick={() => setShowcaseView("desktop")}
              role="tab"
              aria-selected={showcaseView === "desktop"}
            >
              <span>🖥️ Desktop Dashboard</span>
            </button>
            <button
              type="button"
              className={cn(
                styles.showcaseTab,
                showcaseView === "mobile" && styles.active,
              )}
              onClick={() => setShowcaseView("mobile")}
              role="tab"
              aria-selected={showcaseView === "mobile"}
            >
              <span>📱 Mobile App</span>
            </button>
            <button
              type="button"
              className={cn(
                styles.showcaseTab,
                showcaseView === "combined" && styles.active,
              )}
              onClick={() => setShowcaseView("combined")}
              role="tab"
              aria-selected={showcaseView === "combined"}
            >
              <span>🔄 Multi-Device View</span>
            </button>
          </div>

          {/* Desktop View */}
          <div
            className={cn(
              styles.showcaseContent,
              showcaseView === "desktop" && styles.active,
              styles.fadeIn,
            )}
            data-fade-in
            style={{ transitionDelay: "0.3s" }}
            role="tabpanel"
          >
            <div
              className={cn(
                styles.desktopFrame,
                styles.appleCard,
                styles.shine,
                styles.interactiveImage,
              )}
            >
              <div className={styles.desktopFrameHeader}>
                <div className={styles.desktopFrameDots}>
                  <div className={styles.desktopFrameDot} />
                  <div className={styles.desktopFrameDot} />
                  <div className={styles.desktopFrameDot} />
                </div>
              </div>
              <img
                src="/static/images/desk.png"
                alt="SiteSpace desktop dashboard interface"
              />
            </div>
            <div className="text-center mt-8">
              <h3 className="text-2xl font-semibold mb-3">
                Powerful Desktop Experience
              </h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Comprehensive project overview, calendar management, and
                real-time booking updates all in one place
              </p>
            </div>
          </div>

          {/* Mobile View */}
          <div
            className={cn(
              styles.showcaseContent,
              showcaseView === "mobile" && styles.active,
            )}
            role="tabpanel"
          >
            <div className="max-w-md mx-auto">
              <div
                className={cn(
                  styles.mobileFrame,
                  styles.appleCard,
                  styles.shine,
                  styles.interactiveImage,
                  "mx-auto",
                )}
                style={{ maxWidth: 380 }}
              >
                <img
                  src="/static/images/mobile.png"
                  alt="SiteSpace mobile app interface"
                />
              </div>
              <div className="text-center mt-8">
                <h3 className="text-2xl font-semibold mb-3">
                  Work from Anywhere
                </h3>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Full functionality on the go - book assets, check schedules,
                  and manage subcontractors from your phone
                </p>
              </div>
            </div>
          </div>

          {/* Combined View */}
          <div
            className={cn(
              styles.showcaseContent,
              showcaseView === "combined" && styles.active,
            )}
            role="tabpanel"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div
                  className={cn(
                    styles.desktopFrame,
                    styles.appleCard,
                    styles.shine,
                    styles.interactiveImage,
                  )}
                >
                  <div className={styles.desktopFrameHeader}>
                    <div className={styles.desktopFrameDots}>
                      <div className={styles.desktopFrameDot} />
                      <div className={styles.desktopFrameDot} />
                      <div className={styles.desktopFrameDot} />
                    </div>
                  </div>
                  <img
                    src="/static/images/desk.png"
                    alt="SiteSpace desktop interface"
                  />
                </div>
              </div>
              <div>
                <div
                  className={cn(
                    styles.mobileFrame,
                    styles.appleCard,
                    styles.shine,
                    styles.interactiveImage,
                    "mx-auto",
                  )}
                  style={{ maxWidth: 340 }}
                >
                  <img
                    src="/static/images/mobile.png"
                    alt="SiteSpace mobile interface"
                  />
                </div>
              </div>
            </div>
            <div className="text-center mt-12">
              <h3 className="text-2xl font-semibold mb-3">
                Seamless Cross-Platform Sync
              </h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Changes made on desktop instantly appear on mobile. Your team
                stays in sync, no matter which device they use
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className={styles.scrollSection}>
        <div id="demo" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className={styles.fadeIn} data-fade-in>
            <h2 className={cn(styles.largeText, "mb-8")}>
              Ready to transform
              <br />
              <span className={styles.gradientText}>your site?</span>
            </h2>
            <p
              className="text-xl text-gray-400 mb-12"
              style={{ fontWeight: 400 }}
            >
              Join forward-thinking teams already using AI to plan smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button type="button" className={styles.btnPrimary}>
                Schedule a Demo
              </button>
              <button type="button" className={styles.btnSecondary}>
                Contact Sales
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              Australian-hosted · Enterprise-ready · Implementation support
              included
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/full-logo-dark.svg"
                  alt="SiteSpace"
                  width={140}
                  height={48}
                  className={styles.logoMark}
                />
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                The intelligent asset booking platform designed for the
                complexities of
                <br />
                for the modern job site.
              </p>
            </div>

            <div>
              <div className="font-medium mb-4 text-sm">Product</div>
              <div className="space-y-3 text-sm text-gray-500">
                <div>
                  <a href="#features" className={styles.footerLink}>
                    Features
                  </a>
                </div>
                <div>
                  <a href="#lookahead" className={styles.footerLink}>
                    Lookahead AI
                  </a>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-4 text-sm">Company</div>
              <div className="space-y-3 text-sm text-gray-500">
                <div>
                  <a href="#" className={styles.footerLink}>
                    About
                  </a>
                </div>
                <div>
                  <a href="#contact" className={styles.footerLink}>
                    Contact
                  </a>
                </div>
                <div>
                  <a href="#" className={styles.footerLink}>
                    Support
                  </a>
                </div>
              </div>
            </div>

            <div>
              <div className="font-medium mb-4 text-sm">Legal</div>
              <div className="space-y-3 text-sm text-gray-500">
                <div>
                  <a href="#" className={styles.footerLink}>
                    Privacy
                  </a>
                </div>
                <div>
                  <a href="#" className={styles.footerLink}>
                    Terms
                  </a>
                </div>
                <div>
                  <a href="#" className={styles.footerLink}>
                    Compliance
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
              <div>© {year} SiteSpace. All rights reserved.</div>
              <div>
                <a
                  href="https://sitespace.com.au"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  sitespace.com.au
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.checkItem}>
      <div className={styles.checkIcon}>
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <span className="text-gray-300">{children}</span>
    </div>
  );
}

function CompactCheck({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className={styles.checkIcon}>
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <span>{children}</span>
    </div>
  );
}

function BenefitItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={styles.checkItem}>
      <div className={styles.checkIcon}>
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div>
        <div className="font-medium mb-1">{title}</div>
        <div className="text-gray-500 text-sm">{description}</div>
      </div>
    </div>
  );
}

function FeatureBlurb({
  title,
  children,
  delay,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  delay: string;
}) {
  return (
    <div
      className={styles.fadeIn}
      data-fade-in
      style={{ transitionDelay: delay }}
    >
      <h3 className={cn(styles.mediumText, "mb-4")}>{title}</h3>
      <p
        className="text-lg text-gray-400"
        style={{ fontWeight: 400, lineHeight: 1.6 }}
      >
        {children}
      </p>
    </div>
  );
}

function PhoneShot({
  delay,
  title,
  description,
  src,
  alt,
  variant = "plain",
}: {
  delay: string;
  title: string;
  description: string;
  src: string;
  alt: string;
  variant?: "device" | "plain";
}) {
  return (
    <div
      className={styles.fadeIn}
      data-fade-in
      style={{ transitionDelay: delay }}
    >
      {variant === "device" ? (
        <div
          className={cn(
            styles.mobileFrameSmall,
            styles.appleCard,
            styles.shine,
            "mx-auto",
          )}
          style={{ ["--shot" as never]: `url(${src})` } as React.CSSProperties}
        >
          <div className={styles.mobileFrameSmallInner}>
            <img src={src} alt={alt} />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            styles.shotPlain,
            styles.glassCard,
            styles.appleCard,
            styles.shine,
            "mx-auto",
          )}
          style={{ ["--shot" as never]: `url(${src})` } as React.CSSProperties}
        >
          <div className={styles.shotPlainInner}>
            <img src={src} alt={alt} className={styles.shotPlainImg} />
          </div>
        </div>
      )}
      <div className="text-center mt-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
}

function HighlightCard({
  title,
  icon,
  iconWrapClassName,
  iconWrapStyle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconWrapClassName: string;
  iconWrapStyle?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(styles.glassCard, "p-6 rounded-2xl text-center")}>
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4",
          iconWrapClassName,
        )}
        style={iconWrapStyle}
      >
        {icon}
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-gray-400">{children}</p>
    </div>
  );
}

function ForecastCard({
  title,
  badgeLabel,
  badgeStyle,
  fillStyle,
  fillWidth,
  subtitle,
}: {
  title: string;
  badgeLabel: string;
  badgeStyle: React.CSSProperties;
  fillStyle: React.CSSProperties;
  fillWidth: string;
  subtitle: string;
}) {
  return (
    <div className={styles.forecastCard}>
      <div className="flex items-center justify-between mb-4">
        <div className="font-medium">{title}</div>
        <div className={styles.badge} style={badgeStyle}>
          <span style={{ color: badgeStyle.color as string }}>
            {badgeLabel}
          </span>
        </div>
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          data-progress-fill
          data-width={fillWidth}
          style={fillStyle}
        />
      </div>
      <div className="text-sm text-gray-500 mt-3">{subtitle}</div>
    </div>
  );
}
