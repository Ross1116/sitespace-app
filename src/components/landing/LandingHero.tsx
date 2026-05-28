import Image from "next/image";

import { AuroraBackground } from "@/components/ui/aurora-background";
import { cn } from "@/lib/utils";

import dashhome from "../../../public/static/images/dashhome.png";
import styles from "./LandingPageOneToOne.module.css";
import { DemoRequestCTA } from "./ContactModal";
import LandingHeroGrid from "./LandingHeroGrid";

export default function LandingHero() {
  return (
    <AuroraBackground className="bg-[#f1f6fa]">
      <LandingHeroGrid />
      <div className="pointer-events-none relative z-10 mx-auto w-full max-w-7xl px-6 pt-16 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className={cn(styles.heroContent, "max-w-3xl text-left")}>
            <h3 className={cn(styles.heroHeadline, "mb-6")}>
              Assets planning & 
              <br />
              booking redefined
            </h3>
            <p
              className="mb-10 max-w-3xl text-xl text-gray-400 md:text-xl"
              style={{ fontWeight: 400 }}
            >
              See every shared asset, booking conflict, and site bottleneck before the day starts.
            </p>
            <DemoRequestCTA
              label="Book a Demo"
              className={cn(
                styles.btnPrimary,
                styles.shine,
                "pointer-events-auto",
              )}
            />
          </div>

          <div
            className={cn(styles.heroContent, "relative justify-self-end")}
            style={{ transitionDelay: "0.2s" }}
          >
            <div className="relative w-fit lg:w-[min(100%,46rem)]">
              <div
                className={cn(
                  styles.desktopFrame,
                  styles.heroDesktopTilt,
                  styles.appleCard,
                  styles.shine,
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
                  sizes="(max-width: 1024px) 92vw, 50vw"
                  className="block h-auto w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
