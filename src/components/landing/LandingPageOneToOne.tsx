import dynamic from "next/dynamic";

import { DemoModalProvider } from "./ContactModal";
import styles from "./LandingPageOneToOne.module.css";
import LandingHeader from "./LandingHeader";
import LandingHero from "./LandingHero";

const LandingPageBelowFoldClient = dynamic(
  () => import("./LandingPageBelowFoldClient"),
  { loading: () => <LandingBelowFoldFallback /> },
);

export default function LandingPageOneToOne() {
  return (
    <DemoModalProvider>
      <div className={styles.root}>
        <LandingHeader />
        <LandingHero />
      </div>
      <LandingPageBelowFoldClient />
    </DemoModalProvider>
  );
}

function LandingBelowFoldFallback() {
  return (
    <div className={styles.root}>
      <section className={styles.sectionSpacing}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            <div className="text-center">
              <div className={styles.statNumber}>85%</div>
              <div className="mt-2 text-sm text-gray-500 md:text-base">
                Fewer conflicts
              </div>
            </div>
            <div className="text-center">
              <div className={styles.statNumber}>2-4</div>
              <div className="mt-2 text-sm text-gray-500 md:text-base">
                Weeks advance notice
              </div>
            </div>
            <div className="text-center">
              <div className={styles.statNumber}>60%</div>
              <div className="mt-2 text-sm text-gray-500 md:text-base">
                Time saved
              </div>
            </div>
            <div className="text-center">
              <div className={styles.statNumber}>100%</div>
              <div className="mt-2 text-sm text-gray-500 md:text-base">
                Audit trail
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
