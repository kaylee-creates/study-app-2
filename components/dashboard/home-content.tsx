"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";

const BG_IMAGES: Record<string, { light: string; dark: string }> = {
  original: { light: "/backgrounds/original.svg", dark: "/backgrounds/original-dark.svg" },
  berry: { light: "/backgrounds/berry.svg", dark: "/backgrounds/berry-dark.svg" },
  icecream: { light: "/backgrounds/icecream.svg", dark: "/backgrounds/icecream-dark.svg" },
  ocean: { light: "/backgrounds/ocean.svg", dark: "/backgrounds/ocean-dark.svg" },
  sunny: { light: "/backgrounds/sunny.svg", dark: "/backgrounds/sunny-dark.svg" },
};

const buttons = [
  { href: "/flashcards", label: "flashcards", top: "8%", left: "50%", rotate: 0, delay: 400 },
  { href: "/planner", label: "planner", top: "42%", left: "8%", rotate: -15, delay: 600 },
  { href: "/pomodoro", label: "pomarado", top: "42%", left: "92%", rotate: 12, delay: 800 },
  { href: "/study-guide", label: "note maker", top: "78%", left: "50%", rotate: 0, delay: 1000 },
];

export function HomeContent() {
  const { settings } = useTheme();
  const name = settings.displayName || "Student";
  const themeImages = BG_IMAGES[settings.activeThemeId] || BG_IMAGES.original;
  const bgImage = settings.darkModeEnabled ? themeImages.dark : themeImages.light;
  const isDark = settings.darkModeEnabled;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const darkGlow = isDark
    ? "0 0 8px rgba(255,255,255,0.35), 0 0 20px rgba(255,255,255,0.15)"
    : undefined;

  const enter = (delayMs: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 800ms ease-out ${delayMs}ms, transform 800ms ease-out ${delayMs}ms`,
  });

  return (
    <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden">
      {/* Theme background image */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          opacity: mounted ? (isDark ? 0.9 : 1) : 0,
          transition: "opacity 1000ms ease-out",
        }}
      />

      {/* Centered wrapper: holds text + buttons so buttons orbit the text */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="relative" style={{ width: "clamp(340px, 80vw, 720px)", height: "clamp(400px, 65vh, 600px)" }}>
          {/* Welcome text -- dead center of wrapper */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <h1 className="leading-none mb-1 text-center" style={enter(300)}>
              <span
                className="font-cursive text-3xl sm:text-4xl text-theme-text"
                style={{ textShadow: darkGlow }}
              >
                welcome,
              </span>{" "}
              <span
                className="font-serif text-6xl sm:text-7xl md:text-8xl text-theme-name"
                style={{ textShadow: darkGlow }}
              >
                {name}
              </span>
            </h1>
            <p
              className="font-serif text-xl mt-3 text-theme-accent-yellow"
              style={{ ...enter(500), textShadow: darkGlow }}
            >
              what would you like to start with today?
            </p>
          </div>

          {/* 4 glass gradient buttons */}
          {buttons.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="absolute z-20 block text-center font-cursive text-xl sm:text-2xl hover:scale-105 pointer-events-auto"
              style={{
                top: b.top,
                left: b.left,
                transform: mounted
                  ? `translate(-50%, -50%) rotate(${b.rotate}deg) scale(1)`
                  : `translate(-50%, -50%) rotate(${b.rotate}deg) scale(0.9)`,
                opacity: mounted ? 1 : 0,
                transition: `opacity 700ms ease-out ${b.delay}ms, transform 700ms ease-out ${b.delay}ms`,
                background: "linear-gradient(135deg, var(--color-nav-glass), var(--color-nav-glass-end))",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid var(--color-btn-border)",
                borderRadius: 20,
                boxShadow: "0 4px 12px var(--color-shadow), inset 0 1px 0 var(--color-btn-highlight)",
                width: "clamp(160px, 28vw, 280px)",
                height: 55,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="text-theme-text-muted" style={{ textShadow: darkGlow }}>{b.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Points display (bottom-right) */}
      <div
        className="absolute bottom-6 right-6 z-10 flex items-center gap-2"
        style={enter(1200)}
      >
        <span
          className="font-serif text-lg text-theme-accent-yellow"
          style={{ textShadow: darkGlow }}
        >
          your points today {settings.totalPoints}
        </span>
      </div>
    </div>
  );
}
