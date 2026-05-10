"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { localStudyRepository, generateId } from "@/lib/storage-local";
import { useTheme } from "@/components/theme-provider";

export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";

interface PomodoroTimerCardProps {
  onStateChange?: (state: { isRunning: boolean; phase: PomodoroPhase }) => void;
}

const PRESETS = {
  focus: [15, 25, 45],
  shortBreak: [5, 10],
  longBreak: [15, 20],
};

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const styles = {
  root: "flex flex-col items-center gap-8 pt-8",
  phaseBadge: "glass rounded-full px-6 py-2 shadow-glass",
  phaseTitle: "font-serif text-card-title font-medium text-theme-text",
  phaseSession: "ml-2 text-small text-theme-text-muted",
  timerWrap: "relative flex items-center justify-center",
  ringSvg: "h-64 w-64 -rotate-90 sm:h-80 sm:w-80",
  ringProgress: "transition-all duration-1000 ease-linear",
  timeDisplay:
    "absolute font-sans text-6xl font-light tabular-nums tracking-tight text-theme-text sm:text-7xl",
  controlsRow: "flex gap-3",
  primaryButton:
    "glass rounded-2xl px-8 py-3 font-serif text-card-title font-medium text-theme-text shadow-glass transition-transform hover:scale-[1.03]",
  resetButton:
    "glass rounded-2xl px-6 py-3 font-serif text-card-title text-theme-text-muted shadow-glass transition-transform hover:scale-[1.03]",
  coinHint: "flex items-center gap-2 text-theme-text-muted",
  coinIcon: "h-4 w-4 shrink-0",
  coinText: "text-small",
  presetsCard: "glass-card w-full max-w-sm space-y-3 rounded-2xl p-4",
  presetRow: "flex items-center justify-between",
  presetLabel: "text-small text-theme-text-muted",
  presetButtons: "flex gap-1.5",
  presetButtonBase: "rounded-lg px-3 py-1.5 text-small font-medium transition-colors",
  presetButtonActive: "bg-theme-accent text-white",
  presetButtonIdle: "bg-theme-bg text-theme-text-muted hover:bg-theme-accent/10",
};

export function PomodoroTimerCard({ onStateChange }: PomodoroTimerCardProps) {
  const { addPoints } = useTheme();
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [phase, setPhase] = useState<PomodoroPhase>("focus");
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const dingRef = useRef<HTMLAudioElement | null>(null);

  const currentDuration = phase === "focus"
    ? focusMinutes * 60
    : phase === "shortBreak"
      ? shortBreakMinutes * 60
      : longBreakMinutes * 60;

  const progress = currentDuration > 0
    ? ((currentDuration - remainingSeconds) / currentDuration) * 100
    : 0;

  const playDing = useCallback(() => {
    if (dingRef.current) {
      dingRef.current.currentTime = 0;
      dingRef.current.play().catch(() => {});
    }
  }, []);

  const handleComplete = useCallback(async () => {
    playDing();

    if (phase === "focus") {
      const pts = Math.round(focusMinutes * 2);
      const session = {
        id: generateId(),
        trackId: null,
        startedAt: new Date(Date.now() - focusMinutes * 60 * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        durationMinutes: focusMinutes,
        isCompleted: true,
        pointsEarned: pts,
        label: "Focus",
      };
      const state = await localStudyRepository.loadStudyState();
      await localStudyRepository.saveStudyState({
        pomodoroSessions: [...state.pomodoroSessions, session],
      });
      await addPoints(pts);

      const newCount = completedFocusSessions + 1;
      setCompletedFocusSessions(newCount);

      if (newCount % 4 === 0) {
        setPhase("longBreak");
        setRemainingSeconds(longBreakMinutes * 60);
      } else {
        setPhase("shortBreak");
        setRemainingSeconds(shortBreakMinutes * 60);
      }
    } else {
      setPhase("focus");
      setRemainingSeconds(focusMinutes * 60);
    }
  }, [phase, focusMinutes, shortBreakMinutes, longBreakMinutes, completedFocusSessions, addPoints, playDing]);

  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, handleComplete]);

  useEffect(() => {
    onStateChange?.({ isRunning, phase });
  }, [isRunning, phase, onStateChange]);

  const toggle = () => setIsRunning((r) => !r);

  const reset = () => {
    setIsRunning(false);
    setPhase("focus");
    setRemainingSeconds(focusMinutes * 60);
    setCompletedFocusSessions(0);
  };

  const phaseColor =
    phase === "focus"
      ? "var(--color-accent)"
      : phase === "shortBreak"
        ? "var(--color-plane-2)"
        : "var(--color-plane-1)";

  return (
    <div className={styles.root}>
      {/* Ding sound element (generated programmatically) */}
      <audio ref={dingRef} preload="auto" src="/sounds/ding.mp3" />

      {/* Phase label */}
      <div
        className={styles.phaseBadge}
        style={{ borderColor: phaseColor, borderWidth: "1px" }}
      >
        <span className={styles.phaseTitle}>
          {PHASE_LABELS[phase]}
        </span>
        <span className={styles.phaseSession}>
          Session {completedFocusSessions + 1}
        </span>
      </div>

      {/* Big timer */}
      <div className={styles.timerWrap}>
        {/* Ring */}
        <svg className={styles.ringSvg} viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="var(--color-plane-3)"
            strokeWidth="6"
            opacity="0.25"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={phaseColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
            className={styles.ringProgress}
          />
        </svg>
        <span className={styles.timeDisplay}>
          {formatSeconds(remainingSeconds)}
        </span>
      </div>

      {/* Controls */}
      <div className={styles.controlsRow}>
        <button
          onClick={toggle}
          className={styles.primaryButton}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className={styles.resetButton}
        >
          Reset
        </button>
      </div>

      {/* Coin hint */}
      <div className={styles.coinHint}>
        <svg className={styles.coinIcon} viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" fill="var(--color-accent-yellow)" opacity="0.6" />
          <text x="10" y="14" textAnchor="middle" fontSize="10" fill="var(--color-text)" fontWeight="bold">$</text>
        </svg>
        <span className={styles.coinText}>Earn 2 coins per minute of focus time</span>
      </div>

      {/* Presets (only when not running and on focus phase) */}
      {!isRunning && (
        <div className={styles.presetsCard}>
          <PresetRow
            label="Focus"
            options={PRESETS.focus}
            value={focusMinutes}
            onChange={(v) => {
              setFocusMinutes(v);
              if (phase === "focus") setRemainingSeconds(v * 60);
            }}
          />
          <PresetRow
            label="Short Break"
            options={PRESETS.shortBreak}
            value={shortBreakMinutes}
            onChange={(v) => {
              setShortBreakMinutes(v);
              if (phase === "shortBreak") setRemainingSeconds(v * 60);
            }}
          />
          <PresetRow
            label="Long Break"
            options={PRESETS.longBreak}
            value={longBreakMinutes}
            onChange={(v) => {
              setLongBreakMinutes(v);
              if (phase === "longBreak") setRemainingSeconds(v * 60);
            }}
          />
        </div>
      )}
    </div>
  );
}

function PresetRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.presetRow}>
      <span className={styles.presetLabel}>{label}</span>
      <div className={styles.presetButtons}>
        {options.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`${styles.presetButtonBase} ${
              value === m ? styles.presetButtonActive : styles.presetButtonIdle
            }`}
          >
            {m}m
          </button>
        ))}
      </div>
    </div>
  );
}
