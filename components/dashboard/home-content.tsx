"use client";

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
  { href: "/flashcards", label: "flashcards", top: "8%", left: "50%", rotate: 0 },
  { href: "/planner", label: "planner", top: "42%", left: "8%", rotate: -15 },
  { href: "/pomodoro", label: "pomarado", top: "42%", left: "92%", rotate: 12 },
  { href: "/study-guide", label: "note maker", top: "78%", left: "50%", rotate: 0 },
];

export function HomeContent() {
  const { settings } = useTheme();
  const name = settings.displayName || "Student";
  const themeImages = BG_IMAGES[settings.activeThemeId] || BG_IMAGES.original;
  const bgImage = settings.darkModeEnabled ? themeImages.dark : themeImages.light;

  return (
    <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden">
      {/* Theme background image (shapes + dots) */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-[1]"
        style={{
          height: 65,
          background: "var(--color-surface)",
          border: "9px solid white",
          boxShadow: "0 4px 4px var(--color-shadow)",
        }}
      />

      {/* Centered wrapper: holds text + buttons so buttons orbit the text */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="relative" style={{ width: "clamp(340px, 80vw, 720px)", height: "clamp(400px, 65vh, 600px)" }}>
          {/* Welcome text -- dead center of wrapper */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <h1 className="leading-none mb-1 text-center">
              <span className="font-cursive text-2xl sm:text-3xl text-theme-text">welcome,</span>{" "}
              <span className="font-serif text-6xl sm:text-7xl md:text-8xl text-theme-accent">{name}</span>
            </h1>
            <p className="font-serif text-base mt-3 text-theme-accent-yellow">
              what would you like to start with today?
            </p>
          </div>

          {/* 4 buttons absolutely positioned around center text */}
          {buttons.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="absolute z-20 block text-center font-cursive text-lg sm:text-xl transition-transform hover:scale-105 pointer-events-auto"
              style={{
                top: b.top,
                left: b.left,
                transform: `translate(-50%, -50%) rotate(${b.rotate}deg)`,
                background: "var(--color-nav-glass)",
                border: "1px solid var(--color-accent-dark)",
                borderRadius: 20,
                boxShadow:
                  "0 4px 4px var(--color-shadow), inset 0 4px 4px var(--color-shadow-light)",
                width: "clamp(160px, 28vw, 280px)",
                height: 55,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="text-theme-text-muted">{b.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Points display (bottom-right) */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
        <span className="font-serif text-sm text-theme-accent-yellow">
          your points today {settings.totalPoints}
        </span>
      </div>
    </div>
  );
}
