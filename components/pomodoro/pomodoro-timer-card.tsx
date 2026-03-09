"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { localStudyRepository, generateId } from "@/lib/storage-local";
import { useTheme } from "@/components/theme-provider";

type Phase = "focus" | "shortBreak" | "longBreak";

const PRESETS = {
  focus: [15, 25, 45],
  shortBreak: [5, 10],
  longBreak: [15, 20],
};

const PHASE_LABELS: Record<Phase, string> = {
  focus: "Focus",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function PomodoroTimerCard() {
  const { addPoints } = useTheme();
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [phase, setPhase] = useState<Phase>("focus");
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
    <div className="flex flex-col items-center gap-8 pt-8">
      {/* Ding sound element (generated programmatically) */}
      <audio ref={dingRef} preload="auto" src="/sounds/ding.mp3" />

      {/* Phase label */}
      <div
        className="glass rounded-full px-6 py-2 shadow-glass"
        style={{ borderColor: phaseColor, borderWidth: "1px" }}
      >
        <span className="font-serif text-sm font-medium text-theme-text">
          {PHASE_LABELS[phase]}
        </span>
        <span className="text-xs text-theme-text-muted ml-2">
          Session {completedFocusSessions + 1}
        </span>
      </div>

      {/* Big timer */}
      <div className="relative flex items-center justify-center">
        {/* Ring */}
        <svg className="w-64 h-64 sm:w-80 sm:h-80 -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="var(--color-surface)"
            strokeWidth="6"
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
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <span className="absolute font-sans text-6xl sm:text-7xl tabular-nums font-light text-theme-text tracking-tight">
          {formatSeconds(remainingSeconds)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={toggle}
          className="glass rounded-2xl px-8 py-3 shadow-glass font-serif text-sm font-medium text-theme-text hover:scale-[1.03] transition-transform"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="glass rounded-2xl px-6 py-3 shadow-glass font-serif text-sm text-theme-text-muted hover:scale-[1.03] transition-transform"
        >
          Reset
        </button>
      </div>

      {/* Presets (only when not running and on focus phase) */}
      {!isRunning && (
        <div className="glass-card rounded-2xl p-4 space-y-3 w-full max-w-sm">
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
    <div className="flex items-center justify-between">
      <span className="text-xs text-theme-text-muted">{label}</span>
      <div className="flex gap-1.5">
        {options.map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              value === m
                ? "bg-theme-accent text-white"
                : "bg-theme-bg text-theme-text-muted hover:bg-theme-accent/10"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>
    </div>
  );
}
