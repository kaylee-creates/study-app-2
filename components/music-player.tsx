"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { getThemeById, extractYoutubeVideoId } from "@/lib/themes";

declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        config: Record<string, unknown>
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  getPlayerState: () => number;
  loadVideoById: (id: string) => void;
  destroy: () => void;
}

const styles = {
  videoLayer:
    "fixed inset-0 overflow-hidden pointer-events-none transition-opacity duration-500",
  videoLayerInner: "absolute inset-0",
  ytPlayer: "h-full w-full",
  darkOverlay:
    "fixed inset-0 pointer-events-none transition-opacity duration-500",
  controlsCard: "glass-card space-y-2 rounded-2xl p-3",
  controlsRow: "flex items-center gap-3",
  playButton:
    "flex h-8 w-8 items-center justify-center rounded-full bg-theme-accent/20 transition-colors hover:bg-theme-accent/30",
  iconPause: "h-3.5 w-3.5 text-theme-accent",
  iconPlay: "ml-0.5 h-3.5 w-3.5 text-theme-accent",
  trackBlock: "min-w-0 flex-1",
  trackTitle: "truncate text-small font-medium text-theme-text",
  trackStatus: "truncate text-caption text-theme-text-muted",
  volumeRange: "h-1 w-16 accent-theme-accent",
  customForm: "flex gap-1.5",
  urlInput:
    "flex-1 rounded-lg border border-theme-accent/20 bg-theme-bg px-2 py-1.5 text-small text-theme-text placeholder:text-theme-text-muted/50",
  buttonReset:
    "rounded-lg bg-theme-accent/10 px-3 py-1.5 text-caption text-theme-text-muted",
  buttonSubmit: "rounded-lg bg-theme-accent px-3 py-1.5 text-caption text-white",
};

interface MusicPlayerProps {
  shouldPlay?: boolean;
}

export function MusicPlayer({ shouldPlay }: MusicPlayerProps) {
  const { settings } = useTheme();
  const [apiReady, setApiReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [usingCustom, setUsingCustom] = useState(false);
  const [volume, setVolume] = useState(30);
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.YT) {
      setApiReady(true);
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => setApiReady(true);
  }, []);

  const currentVideoId = useCallback((): string | null => {
    if (usingCustom && customUrl) {
      return extractYoutubeVideoId(customUrl);
    }
    const theme = getThemeById(settings.activeThemeId);
    if (theme?.youtubeUrl) {
      return extractYoutubeVideoId(theme.youtubeUrl);
    }
    return null;
  }, [settings.activeThemeId, usingCustom, customUrl]);

  useEffect(() => {
    if (!apiReady || !settings.backgroundMusicEnabled) {
      playerRef.current?.destroy();
      playerRef.current = null;
      return;
    }

    const videoId = currentVideoId();
    if (!videoId) return;

    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      playerRef.current.setVolume(volume);
      return;
    }

    playerRef.current = new window.YT.Player("yt-player", {
      height: "100%",
      width: "100%",
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        loop: 1,
        playlist: videoId,
        modestbranding: 1,
        showinfo: 0,
        rel: 0,
      },
      events: {
        onReady: (event: { target: YTPlayer }) => {
          event.target.setVolume(volume);
          if (shouldPlay === undefined || shouldPlay) {
            event.target.playVideo();
          } else {
            event.target.pauseVideo();
          }
        },
        onStateChange: (event: { data: number }) => {
          setIsPlaying(event.data === 1);
        },
      },
    } as Record<string, unknown>);
  }, [apiReady, settings.backgroundMusicEnabled, currentVideoId, volume, shouldPlay]);

  useEffect(() => {
    playerRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (shouldPlay === undefined || !playerRef.current) return;
    if (shouldPlay) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [shouldPlay]);

  if (!settings.backgroundMusicEnabled) return null;

  const togglePlay = () => {
    if (!playerRef.current || shouldPlay !== undefined) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      setUsingCustom(true);
    }
  };

  const clearCustom = () => {
    setUsingCustom(false);
    setCustomUrl("");
  };

  const showVideoBackground = usingCustom && isPlaying;

  return (
    <>
      {/* Fullscreen video background layer (only when custom URL is active) */}
      <div
        ref={containerRef}
        className={styles.videoLayer}
        style={{
          zIndex: 0,
          opacity: showVideoBackground ? 0.2 : 0,
        }}
      >
        <div
          className={styles.videoLayerInner}
          style={{
            width: "110vw",
            height: "110vh",
            left: "-5vw",
            top: "-5vh",
          }}
        >
          <div id="yt-player" className={styles.ytPlayer} />
        </div>
      </div>

      {/* Dark overlay to keep text readable when video is visible */}
      {showVideoBackground && (
        <div
          className={styles.darkOverlay}
          style={{
            zIndex: 1,
            backgroundColor: "var(--color-bg)",
            opacity: 0.75,
          }}
        />
      )}

      {/* Mini player controls */}
      <div className={styles.controlsCard} style={{ position: "relative", zIndex: 10 }}>
        <div className={styles.controlsRow}>
          <button
            onClick={togglePlay}
            className={styles.playButton}
          >
            {isPlaying ? (
              <svg className={styles.iconPause} viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="1" width="3.5" height="10" rx="0.5" />
                <rect x="7.5" y="1" width="3.5" height="10" rx="0.5" />
              </svg>
            ) : (
              <svg className={styles.iconPlay} viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 1.5l8.5 4.5L2 10.5z" />
              </svg>
            )}
          </button>

          <div className={styles.trackBlock}>
            <p className={styles.trackTitle}>
              {usingCustom ? "Custom Track" : "Theme Music"}
            </p>
            <p className={styles.trackStatus}>
              {isPlaying ? "Playing" : "Paused"}
              {usingCustom && isPlaying ? " (video bg)" : ""}
            </p>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className={styles.volumeRange}
          />
        </div>

        <form onSubmit={handleCustomSubmit} className={styles.customForm}>
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            className={styles.urlInput}
          />
          {usingCustom ? (
            <button
              type="button"
              onClick={clearCustom}
              className={styles.buttonReset}
            >
              Reset
            </button>
          ) : (
            <button
              type="submit"
              className={styles.buttonSubmit}
            >
              Play
            </button>
          )}
        </form>
      </div>
    </>
  );
}
