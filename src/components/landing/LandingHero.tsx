import Image from "next/image";
import { Outfit } from "next/font/google";

import { AuroraBackground } from "@/components/ui/aurora-background";
import { cn } from "@/lib/utils";

import dashhome from "../../../public/static/images/dashhome.png";
import mobileApp from "../../../public/static/images/mobile.png";
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
    <AuroraBackground className="bg-[#f1f6fa]">
      <LandingHeroGrid />
      <div className="pointer-events-none relative z-10 mx-auto w-full max-w-[1440px] px-4 pt-20 sm:px-5 md:px-6 md:pt-24 lg:px-7 lg:pt-28">
        <div className="grid items-center gap-y-12 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-x-6 xl:gap-x-10">
          <div className={cn(styles.heroContent, styles.heroCopy, outfit.className, "text-left")}>
            <div className={styles.heroEyebrow}>
              The Future of Construction
            </div>
            <h1 className={styles.heroHeadline}>
              Asset planning &
              booking redefined
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
                  sizes="(max-width: 1024px) 96vw, 58vw"
                  className="block h-auto w-full"
                />
              </div>

              <div
                className={cn(styles.heroMobilePanel, "pointer-events-auto")}
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
                      priority
                      sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 300px"
                      className={styles.heroPhoneImage}
                    />
                  </div>

                  <span className={styles.heroPhoneHomeBar} aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
