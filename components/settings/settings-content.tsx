"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { extractYoutubeVideoId } from "@/lib/themes";

const styles = {
  root: "mx-auto max-w-md space-y-8 pt-4",
  titleBlock: "text-center",
  title: "font-cursive text-7xl text-theme-text sm:text-8xl",
  surfaceCard: "space-y-6 rounded-2xl border-2 p-6",
  profileSection: "space-y-2",
  label: "font-serif text-card-title text-theme-text-muted",
  nameForm: "flex gap-2",
  nameInput:
    "flex-1 rounded-xl border border-theme-accent/30 bg-white/80 px-4 py-2.5 text-body text-theme-text placeholder:text-theme-text-muted/50 focus:border-theme-accent focus:outline-none",
  saveButton:
    "rounded-xl bg-theme-accent px-4 py-2.5 text-small font-medium text-white transition-transform hover:scale-[1.02]",
  divider: "h-px bg-white/30",
  toggleRow: "flex items-center justify-between",
  toggleLabel: "font-serif text-card-title text-theme-text-muted",
  toggleButton: "relative",
  toggleTrack: "h-7 w-14 rounded-full transition-colors",
  toggleTrackOn: "bg-theme-accent",
  toggleTrackOff: "bg-theme-accent/40",
  toggleThumb:
    "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
  toggleThumbOn: "translate-x-7",
  toggleThumbOff: "translate-x-1",
  musicSection: "space-y-3",
  musicSubBlock: "space-y-2",
  musicHint: "text-small text-theme-text/70",
  musicForm: "flex gap-2",
  musicInput:
    "flex-1 rounded-xl border border-theme-accent/20 bg-white/80 px-3 py-2 text-small text-theme-text placeholder:text-theme-text-muted/50 focus:border-theme-accent focus:outline-none",
  musicResetButton:
    "rounded-xl bg-white/50 px-3 py-2 text-small text-theme-text-muted",
  musicPlayButton: "rounded-xl bg-theme-accent px-3 py-2 text-small text-white",
  shopLink:
    "flex items-center justify-between rounded-xl px-1 py-2 transition-colors hover:bg-white/10",
  shopLinkLabel: "font-serif text-card-title text-theme-text-muted",
  shopLinkMeta: "flex items-center gap-2",
  shopCoins: "text-small text-theme-text-muted",
  shopCoinIcon: "mr-1 inline h-4 w-4",
  shopChevron: "text-theme-text-muted",
};

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
    <div className={styles.root}>
      {/* Title */}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>settings</h1>
      </div>

      {/* Green card with pink border */}
      <div
        className={styles.surfaceCard}
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-accent)",
        }}
      >
        {/* Profile section */}
        <div className={styles.profileSection}>
          <label className={styles.label}>display name</label>
          <form onSubmit={handleNameSave} className={styles.nameForm}>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className={styles.nameInput}
              placeholder="Your name"
            />
            <button
              type="submit"
              className={styles.saveButton}
            >
              Save
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Light/Dark mode toggle */}
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>
            {settings.darkModeEnabled ? "dark mode" : "light mode"}
          </span>
          <button
            onClick={toggleDarkMode}
            className={styles.toggleButton}
            aria-label="Toggle dark mode"
          >
            <div
              className={cn(
                styles.toggleTrack,
                settings.darkModeEnabled ? styles.toggleTrackOn : styles.toggleTrackOff
              )}
            >
              <div
                className={cn(
                  styles.toggleThumb,
                  settings.darkModeEnabled ? styles.toggleThumbOn : styles.toggleThumbOff
                )}
              />
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Background music */}
        <div className={styles.musicSection}>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>background music</span>
            <button
              onClick={toggleBackgroundMusic}
              className={styles.toggleButton}
              aria-label="Toggle background music"
            >
              <div
                className={cn(
                  styles.toggleTrack,
                  settings.backgroundMusicEnabled ? styles.toggleTrackOn : styles.toggleTrackOff
                )}
              >
                <div
                  className={cn(
                    styles.toggleThumb,
                    settings.backgroundMusicEnabled ? styles.toggleThumbOn : styles.toggleThumbOff
                  )}
                />
              </div>
            </button>
          </div>

          {settings.backgroundMusicEnabled && (
            <div className={styles.musicSubBlock}>
              <p className={styles.musicHint}>custom YouTube music</p>
              <form onSubmit={handleMusicUrlSubmit} className={styles.musicForm}>
                <input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Paste YouTube URL..."
                  className={styles.musicInput}
                />
                {musicUrlActive ? (
                  <button
                    type="button"
                    onClick={() => { setMusicUrlActive(false); setCustomUrl(""); }}
                    className={styles.musicResetButton}
                  >
                    Reset
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={styles.musicPlayButton}
                  >
                    Play
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Theme Shop link */}
        <Link
          href="/shop"
          className={styles.shopLink}
        >
          <span className={styles.shopLinkLabel}>theme shop</span>
          <div className={styles.shopLinkMeta}>
            <span className={styles.shopCoins}>
              <svg className={styles.shopCoinIcon} viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="var(--color-accent-yellow)" opacity="0.8" />
                <text x="10" y="14" textAnchor="middle" fontSize="10" fill="var(--color-text)" fontWeight="bold">$</text>
              </svg>
              {settings.totalPoints}
            </span>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className={styles.shopChevron}>
              <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}
