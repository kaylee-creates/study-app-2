"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme-provider";

const features = [
  {
    href: "/pomodoro",
    label: "Pomodoro",
    description: "Focus timer with breaks",
    icon: "⏱",
  },
  {
    href: "/study-guide",
    label: "Study Guide",
    description: "PDF to structured notes",
    icon: "📖",
  },
  {
    href: "/flashcards",
    label: "Flashcards",
    description: "Review & memorize",
    icon: "🃏",
  },
  {
    href: "/planner",
    label: "Calendar",
    description: "Plan your schedule",
    icon: "📅",
  },
  {
    href: "/scrapbook",
    label: "Scrapbook",
    description: "Decorate & personalize",
    icon: "✂️",
  },
];

export function HomeContent() {
  const { settings } = useTheme();
  const name = settings.displayName || "Student";

  return (
    <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden">
      {/* Sharp geometric triangular planes */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: "var(--color-plane-1)",
          clipPath: "polygon(0% 0%, 75% 0%, 0% 85%)",
          opacity: 0.9,
        }}
      />
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: "var(--color-plane-2)",
          clipPath: "polygon(30% 0%, 100% 0%, 100% 55%, 60% 30%)",
          opacity: 0.85,
        }}
      />
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: "var(--color-plane-3)",
          clipPath: "polygon(0% 50%, 55% 100%, 0% 100%)",
          opacity: 0.88,
        }}
      />

      {/* Decorative hand-drawn line on the green plane edge */}
      <svg
        className="absolute z-[1] pointer-events-none"
        style={{ left: "0%", top: "50%", width: "55%", height: "52%" }}
        viewBox="0 0 400 300"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 Q80,10 160,60 T320,180 T400,300"
          stroke="var(--color-plane-3)"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.5"
        />
        <path
          d="M5,5 Q85,18 165,65 T325,185"
          stroke="var(--color-text-muted)"
          strokeWidth="0.8"
          opacity="0.18"
        />
      </svg>

      {/* Wavy yellow strip near top-left */}
      <svg
        className="absolute z-[2] pointer-events-none"
        style={{ left: "2%", top: "8%", width: "30%", height: "40px" }}
        viewBox="0 0 300 30"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0,15 C20,5 40,25 60,15 C80,5 100,25 120,15 C140,5 160,25 180,15 C200,5 220,25 240,15 C260,5 280,25 300,15"
          stroke="var(--color-plane-2)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>

      {/* Decorative dots (top-left) */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
        <div
          className="w-3.5 h-3.5 rounded-full"
          style={{ background: "var(--color-plane-1)" }}
        />
        <div
          className="w-3.5 h-3.5 rounded-full"
          style={{ background: "var(--color-plane-2)" }}
        />
        <div
          className="w-3.5 h-3.5 rounded-full"
          style={{ background: "var(--color-plane-3)" }}
        />
      </div>

      {/* Hero section */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-20 pb-12 px-4">
        <h1 className="font-cursive text-6xl sm:text-7xl md:text-8xl text-theme-text leading-none mb-2">
          {name}
        </h1>
        <p className="font-serif text-lg text-theme-text-muted mt-2">
          Welcome back
        </p>

        {/* Points display */}
        <div className="mt-4 glass rounded-full px-5 py-1.5 shadow-glass">
          <span className="text-sm font-medium text-theme-text">
            {settings.totalPoints} coins
          </span>
        </div>
      </div>

      {/* Feature tiles */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="glass-card rounded-2xl p-4 flex flex-col items-center text-center gap-2 hover:scale-[1.03] transition-transform"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="font-serif text-sm font-medium text-theme-text">
                {f.label}
              </span>
              <span className="text-xs text-theme-text-muted leading-tight">
                {f.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
