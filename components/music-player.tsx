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

export function MusicPlayer() {
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
          event.target.playVideo();
          setIsPlaying(true);
        },
        onStateChange: (event: { data: number }) => {
          setIsPlaying(event.data === 1);
        },
      },
    } as Record<string, unknown>);
  }, [apiReady, settings.backgroundMusicEnabled, currentVideoId, volume]);

  useEffect(() => {
    playerRef.current?.setVolume(volume);
  }, [volume]);

  if (!settings.backgroundMusicEnabled) return null;

  const togglePlay = () => {
    if (!playerRef.current) return;
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
        className="fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-500"
        style={{
          zIndex: 0,
          opacity: showVideoBackground ? 0.2 : 0,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            width: "110vw",
            height: "110vh",
            left: "-5vw",
            top: "-5vh",
          }}
        >
          <div id="yt-player" className="w-full h-full" />
        </div>
      </div>

      {/* Dark overlay to keep text readable when video is visible */}
      {showVideoBackground && (
        <div
          className="fixed inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            zIndex: 1,
            backgroundColor: "var(--color-bg)",
            opacity: 0.75,
          }}
        />
      )}

      {/* Mini player controls */}
      <div className="glass-card rounded-2xl p-3 space-y-2" style={{ position: "relative", zIndex: 10 }}>
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-theme-accent/20 flex items-center justify-center hover:bg-theme-accent/30 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-3.5 h-3.5 text-theme-accent" viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="1" width="3.5" height="10" rx="0.5" />
                <rect x="7.5" y="1" width="3.5" height="10" rx="0.5" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-theme-accent ml-0.5" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 1.5l8.5 4.5L2 10.5z" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-theme-text truncate font-medium">
              {usingCustom ? "Custom Track" : "Theme Music"}
            </p>
            <p className="text-[10px] text-theme-text-muted truncate">
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
            className="w-16 h-1 accent-theme-accent"
          />
        </div>

        <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            className="flex-1 rounded-lg px-2 py-1 text-xs bg-theme-bg border border-theme-accent/20 text-theme-text placeholder:text-theme-text-muted/50"
          />
          {usingCustom ? (
            <button
              type="button"
              onClick={clearCustom}
              className="text-[10px] px-2 py-1 rounded-lg bg-theme-accent/10 text-theme-text-muted"
            >
              Reset
            </button>
          ) : (
            <button
              type="submit"
              className="text-[10px] px-2 py-1 rounded-lg bg-theme-accent text-white"
            >
              Play
            </button>
          )}
        </form>
      </div>
    </>
  );
}
