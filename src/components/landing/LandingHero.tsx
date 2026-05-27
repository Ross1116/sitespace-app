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
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className={cn(styles.heroContent, "max-w-3xl text-left")}>
            <h1 className={cn(styles.giantText, "mb-6")}>
              The future of
              <br />
              construction
            </h1>
            <p
              className="mb-10 max-w-3xl text-xl text-gray-400 md:text-2xl"
              style={{ fontWeight: 400 }}
            >
              Program driven predictive logistics intelligence tool
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
            <div className="relative w-fit">
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
