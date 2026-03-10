"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { extractYoutubeVideoId } from "@/lib/themes";

export function SettingsContent() {
  const {
    settings,
    toggleDarkMode,
    toggleBackgroundMusic,
    updateDisplayName,
  } = useTheme();
  const [nameInput, setNameInput] = useState(settings.displayName);
  const [customUrl, setCustomUrl] = useState("");
  const [musicUrlActive, setMusicUrlActive] = useState(false);

  useEffect(() => {
    setNameInput(settings.displayName);
  }, [settings.displayName]);

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed) await updateDisplayName(trimmed);
  };

  const handleMusicUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim() && extractYoutubeVideoId(customUrl)) {
      setMusicUrlActive(true);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pt-4">
      {/* Title */}
      <div className="text-center">
        <h1 className="font-cursive text-7xl sm:text-8xl text-theme-text">settings</h1>
      </div>

      {/* Green card with pink border */}
      <div
        className="rounded-2xl p-6 space-y-6 border-2"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-accent)",
        }}
      >
        {/* Profile section */}
        <div className="space-y-2">
          <label className="font-serif text-lg text-theme-text-muted">display name</label>
          <form onSubmit={handleNameSave} className="flex gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 rounded-xl px-4 py-2.5 text-base bg-white/80 border border-theme-accent/30 text-theme-text placeholder:text-theme-text-muted/50 focus:outline-none focus:border-theme-accent"
              placeholder="Your name"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-theme-accent text-white text-sm font-medium hover:scale-[1.02] transition-transform"
            >
              Save
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/30" />

        {/* Light/Dark mode toggle */}
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg text-theme-text-muted">
            {settings.darkModeEnabled ? "dark mode" : "light mode"}
          </span>
          <button
            onClick={toggleDarkMode}
            className="relative"
            aria-label="Toggle dark mode"
          >
            <div
              className={cn(
                "w-14 h-7 rounded-full transition-colors",
                settings.darkModeEnabled ? "bg-theme-accent" : "bg-theme-accent/40"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  settings.darkModeEnabled ? "translate-x-7" : "translate-x-1"
                )}
              />
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/30" />

        {/* Background music */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-serif text-lg text-theme-text-muted">background music</span>
            <button
              onClick={toggleBackgroundMusic}
              className="relative"
              aria-label="Toggle background music"
            >
              <div
                className={cn(
                  "w-14 h-7 rounded-full transition-colors",
                  settings.backgroundMusicEnabled ? "bg-theme-accent" : "bg-theme-accent/40"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                    settings.backgroundMusicEnabled ? "translate-x-7" : "translate-x-1"
                  )}
                />
              </div>
            </button>
          </div>

          {settings.backgroundMusicEnabled && (
            <div className="space-y-2">
              <p className="text-sm text-theme-text/70">custom YouTube music</p>
              <form onSubmit={handleMusicUrlSubmit} className="flex gap-2">
                <input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Paste YouTube URL..."
                  className="flex-1 rounded-xl px-3 py-2 text-sm bg-white/80 border border-theme-accent/20 text-theme-text placeholder:text-theme-text-muted/50 focus:outline-none focus:border-theme-accent"
                />
                {musicUrlActive ? (
                  <button
                    type="button"
                    onClick={() => { setMusicUrlActive(false); setCustomUrl(""); }}
                    className="text-sm px-3 py-2 rounded-xl bg-white/50 text-theme-text-muted"
                  >
                    Reset
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="text-sm px-3 py-2 rounded-xl bg-theme-accent text-white"
                  >
                    Play
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/30" />

        {/* Theme Shop link */}
        <Link
          href="/shop"
          className="flex items-center justify-between py-2 px-1 rounded-xl hover:bg-white/10 transition-colors"
        >
          <span className="font-serif text-lg text-theme-text-muted">theme shop</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-theme-text-muted">
              <svg className="inline w-4 h-4 mr-1" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="var(--color-accent-yellow)" opacity="0.8" />
                <text x="10" y="14" textAnchor="middle" fontSize="10" fill="var(--color-text)" fontWeight="bold">$</text>
              </svg>
              {settings.totalPoints}
            </span>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="text-theme-text-muted">
              <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}
