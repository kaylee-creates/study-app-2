"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/components/theme-provider";
import { WelcomeModal } from "@/components/welcome-modal";

export function PageTransitions({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings, isLoaded } = useTheme();
  const [showWelcome, setShowWelcome] = useState(false);
  const [blurActive, setBlurActive] = useState(true);
  const [pinkFade, setPinkFade] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const [welcomeCheckDone, setWelcomeCheckDone] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    const hasVisited = sessionStorage.getItem("kaylee-visited");
    if (!settings.displayName) {
      setShowWelcome(true);
      setBlurActive(true);
    } else if (!hasVisited) {
      setBlurActive(true);
      setTimeout(() => {
        setBlurActive(false);
        sessionStorage.setItem("kaylee-visited", "1");
      }, 100);
    } else {
      setBlurActive(false);
    }
    setWelcomeCheckDone(true);
  }, [isLoaded, settings.displayName]);

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
    setTimeout(() => {
      setBlurActive(false);
      sessionStorage.setItem("kaylee-visited", "1");
    }, 100);
  }, []);

  // Pink fade on route change
  useEffect(() => {
    if (pathname !== prevPath) {
      setPinkFade(true);
      setPrevPath(pathname);
      const timer = setTimeout(() => setPinkFade(false), 450);
      return () => clearTimeout(timer);
    }
  }, [pathname, prevPath]);

  if (!isLoaded || !welcomeCheckDone) {
    return <div className="min-h-screen bg-theme-bg" />;
  }

  return (
    <>
      {showWelcome && <WelcomeModal onComplete={handleWelcomeComplete} />}

      {/* Blur-to-clear overlay */}
      <div
        className="fixed inset-0 z-[90] pointer-events-none transition-all duration-[800ms] ease-out"
        style={{
          backdropFilter: blurActive ? "blur(20px)" : "blur(0px)",
          WebkitBackdropFilter: blurActive ? "blur(20px)" : "blur(0px)",
          opacity: blurActive ? 1 : 0,
        }}
      />

      {/* Pink fade overlay on page change */}
      <div
        className="fixed inset-0 z-[80] pointer-events-none transition-opacity duration-[400ms] ease-out"
        style={{
          background: "var(--color-overlay-pink)",
          opacity: pinkFade ? 1 : 0,
        }}
      />

      {children}
    </>
  );
}
