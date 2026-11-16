
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";

type FootballSimLoaderProps = {
  fullScreen?: boolean;
  message?: string;
  className?: string;
};

export default function FootballSimLoader({
  fullScreen = true,
  message = "Preparing your football universe",
  className = "",
}: FootballSimLoaderProps) {
  const reducedMotion = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={[
        "relative isolate flex w-full items-center justify-center overflow-hidden",
        "bg-[#070a0e] text-white",
        fullScreen ? "min-h-dvh" : "min-h-[280px]",
        className,
      ].join(" ")}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_42%,rgba(183,245,106,0.075),transparent_42%)]" />

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative flex w-full max-w-md flex-col items-center px-6 text-center">
        {/* Trophy emblem */}
        <motion.div
          initial={
            reducedMotion
              ? false
              : { opacity: 0, scale: 0.85, y: 10 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative mb-8"
        >
          {/* Soft outer glow */}
          <motion.div
            aria-hidden="true"
            className="absolute -inset-5 rounded-full bg-[#b7f56a]/10 blur-2xl"
            animate={
              reducedMotion
                ? undefined
                : { opacity: [0.35, 0.7, 0.35] }
            }
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Premium icon frame */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] border border-[#b7f56a]/25 bg-[linear-gradient(145deg,rgba(183,245,106,0.12),rgba(183,245,106,0.025))] shadow-[0_15px_45px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-[5px] rounded-[19px] border border-white/[0.035]" />

            <Trophy
              size={37}
              strokeWidth={1.65}
              className="relative text-[#b7f56a]"
              aria-hidden="true"
            />
          </div>
        </motion.div>

        {/* Brand */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.12 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-[clamp(2rem,8vw,2.75rem)] font-bold tracking-[-0.065em]">
            Football
            <span className="text-[#b7f56a]">Sim</span>
          </h1>

          <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[#81909e]">
            The game is yours
          </p>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-11 flex w-full max-w-[180px] flex-col items-center gap-4"
        >
          <div
            aria-hidden="true"
            className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/10"
          >
            <motion.div
              className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-[#b7f56a] shadow-[0_0_12px_rgba(183,245,106,0.6)]"
              animate={
                reducedMotion
                  ? { x: "80%" }
                  : { x: ["-110%", "300%"] }
              }
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 1.65,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
            />
          </div>

          <p className="text-[11px] tracking-[0.025em] text-[#8c98a7]">
            {message}
            <span className="sr-only">. Please wait.</span>
          </p>
        </motion.div>

        {/* Developer signature */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-14 flex flex-col items-center gap-2"
        >
          <div className="h-px w-8 bg-[#b7f56a]/35" />

          <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-[#697685]">
            Designed &amp; Developed by
          </p>

          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#c7d0da]">
            Dada Kingsley Oluwasanmi
          </p>
        </motion.div>
      </div>
    </div>
  );
}
