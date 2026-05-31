import Image from "next/image";
import { Outfit } from "next/font/google";

import { AuroraBackground } from "@/components/ui/aurora-background";
import { cn } from "@/lib/utils";

import dashhome from "../../../public/static/images/dashhome.png";
import mobileApp from "../../../public/static/images/mobile.jpeg";
import styles from "./LandingPageOneToOne.module.css";
import { DemoRequestCTA } from "./ContactModal";
import LandingHeroGrid from "./LandingHeroGrid";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function LandingHero() {
  return (
    <AuroraBackground className="bg-[#f1f6fa] max-lg:h-auto max-lg:min-h-[100svh] max-lg:overflow-visible">
      <LandingHeroGrid />

      <section
        className={cn(
          styles.heroOuter,
          "pointer-events-none relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-5 md:px-6 lg:px-7",
        )}
      >
        <div
          className={cn(
            styles.heroLayout,
            "grid items-center lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]",
          )}
        >
          <div
            className={cn(
              styles.heroContent,
              styles.heroCopy,
              outfit.className,
            )}
          >
            <div className={styles.heroEyebrow}>
              The Future of Construction
            </div>

            <h1 className={styles.heroHeadline}>
              Asset planning & booking redefined
            </h1>

            <p className={styles.heroLead}>
              See every shared asset, booking conflict, and site bottleneck
              before the day starts.
            </p>

            <div className={styles.heroActions}>
              <DemoRequestCTA
                label="Book a Demo"
                className={cn(
                  styles.btnPrimary,
                  styles.shine,
                  "pointer-events-auto",
                )}
              />
            </div>
          </div>

          <div
            className={cn(styles.heroContent, styles.heroVisual)}
            style={{ transitionDelay: "0.2s" }}
          >
            <div className={styles.heroVisualStage}>
              <div
                className={cn(
                  styles.desktopFrame,
                  styles.heroDesktopTilt,
                  styles.appleCard,
                  styles.heroVisualShine,
                  styles.heroDesktopPanel,
                  "pointer-events-auto",
                )}
              >
                <div className={styles.desktopFrameHeader}>
                  <div className={styles.desktopFrameDots}>
                    <div className={styles.desktopFrameDot} />
                    <div className={styles.desktopFrameDot} />
                    <div className={styles.desktopFrameDot} />
                  </div>
                </div>

                <Image
                  src={dashhome}
                  alt="SiteSpace home dashboard"
                  priority
                  fetchPriority="high"
                  placeholder="blur"
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 86vw, 58vw"
                  className="block h-auto w-full"
                />
              </div>

              <div
                className={cn(
                  styles.heroMobilePanel,
                  "pointer-events-auto max-lg:hidden",
                )}
              >
                <div
                  className={cn(
                    styles.heroPhoneShell,
                    styles.heroPhoneInteractive,
                    styles.heroVisualShine,
                  )}
                >
                  <div className={styles.heroPhoneScreen}>
                    <Image
                      src={mobileApp}
                      alt="SiteSpace mobile app"
                      loading="lazy"
                      sizes="(max-width: 640px) 34vw, (max-width: 1024px) 24vw, 300px"
                      className={styles.heroPhoneImage}
                    />
                  </div>

                  <span className={styles.heroPhoneHomeBar} aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AuroraBackground>
  );
}
