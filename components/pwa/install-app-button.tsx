
"use client";

import { useEffect, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true);

    setIsInstalled(standalone);

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1);

    setIsIOS(ios);

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowIOSGuide(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstall
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        await installPrompt.userChoice;
      } finally {
        setInstallPrompt(null);
      }
      return;
    }

    if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (isInstalled || (!installPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="
          inline-flex items-center justify-center gap-2
          rounded-xl bg-[#b7f56a] px-5 py-3
          text-sm font-semibold text-[#070a0e]
          transition-all duration-200
          hover:bg-[#c8ff85]
          active:scale-[0.98]
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-[#b7f56a]
        "
      >
        <Download className="h-4 w-4" />
        Install FootballSim
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-ios-title"
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#101720] p-6 text-white shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close installation instructions"
              onClick={() => setShowIOSGuide(false)}
              className="absolute right-4 top-4 text-white/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#b7f56a]/10 text-[#b7f56a]">
              <Smartphone className="h-6 w-6" />
            </div>

            <h2
              id="install-ios-title"
              className="text-xl font-bold"
            >
              Install FootballSim
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Add FootballSim to your iPhone home screen for
              an app-like experience.
            </p>

            <ol className="mt-5 space-y-4 text-sm text-white/80">
              <li className="flex items-center gap-3">
                <Share2 className="h-5 w-5 shrink-0 text-[#b7f56a]" />
                Tap the Share button in Safari.
              </li>
              <li>
                Select <strong>Add to Home Screen</strong>.
              </li>
              <li>
                Enable <strong>Open as Web App</strong> if shown,
                then tap <strong>Add</strong>.
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full rounded-xl bg-[#b7f56a] py-3 text-sm font-semibold text-[#070a0e]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
