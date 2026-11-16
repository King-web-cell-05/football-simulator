
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import FootballSimLoader from "@/components/shared/footballsim-loader";

const INTRO_DURATION = 1900;

export default function FootballSimStartup() {
  const [showLoader, setShowLoader] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const hasSeenIntro =
      sessionStorage.getItem("footballsim-intro-seen") === "true";

    if (hasSeenIntro || reducedMotion) {
      setInitialized(true);
      return;
    }

    setShowLoader(true);
    setInitialized(true);

    const timeout = window.setTimeout(() => {
      setShowLoader(false);
      sessionStorage.setItem("footballsim-intro-seen", "true");
    }, INTRO_DURATION);

    return () => window.clearTimeout(timeout);
  }, [reducedMotion]);

  if (!initialized) return null;

  return (
    <AnimatePresence>
      {showLoader && (
        <motion.div
          key="footballsim-intro"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.55,
            ease: "easeInOut",
          }}
          className="fixed inset-0 z-[9999] bg-[#070a0e]"
        >
          <FootballSimLoader
            fullScreen
            message="Preparing your football universe"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
