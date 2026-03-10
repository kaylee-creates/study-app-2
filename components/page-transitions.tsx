"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import { WelcomeModal } from "@/components/welcome-modal";

export function PageTransitions({ children }: { children: React.ReactNode }) {
  const { settings, isLoaded } = useTheme();
  const [showWelcome, setShowWelcome] = useState(false);
  const [blurActive, setBlurActive] = useState(true);
  const [welcomeCheckDone, setWelcomeCheckDone] = useState(false);
  const welcomeDismissed = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (welcomeDismissed.current) return;

    const hasVisited = sessionStorage.getItem("kaylee-visited");
    if (!settings.displayName) {
      setShowWelcome(true);
      setBlurActive(true);
    } else if (!hasVisited) {
      setBlurActive(true);
      setTimeout(() => {
        setBlurActive(false);
        sessionStorage.setItem("kaylee-visited", "1");
      }, 300);
    } else {
      setBlurActive(false);
    }
    setWelcomeCheckDone(true);
  }, [isLoaded, settings.displayName]);

  const handleWelcomeComplete = useCallback(() => {
    welcomeDismissed.current = true;
    setShowWelcome(false);
    setTimeout(() => {
      setBlurActive(false);
      sessionStorage.setItem("kaylee-visited", "1");
    }, 300);
  }, []);

  if (!isLoaded || !welcomeCheckDone) {
    return <div className="min-h-screen" style={{ background: "transparent" }} />;
  }

  return (
    <>
      {showWelcome && <WelcomeModal onComplete={handleWelcomeComplete} />}

      {/* Blur-to-clear overlay */}
      <div
        className="fixed inset-0 z-[90] pointer-events-none transition-all duration-[1200ms] ease-out"
        style={{
          backdropFilter: blurActive ? "blur(20px)" : "blur(0px)",
          WebkitBackdropFilter: blurActive ? "blur(20px)" : "blur(0px)",
          opacity: blurActive ? 1 : 0,
        }}
      />

      {children}
    </>
  );
}
