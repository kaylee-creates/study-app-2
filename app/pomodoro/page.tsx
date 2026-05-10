"use client";

import { useState } from "react";
import { PomodoroTimerCard } from "@/components/pomodoro/pomodoro-timer-card";
import type { PomodoroPhase } from "@/components/pomodoro/pomodoro-timer-card";
import { MusicPlayer } from "@/components/music-player";

const styles = {
  root: "mx-auto max-w-lg space-y-6",
  title: "font-serif text-page-title text-theme-text text-center",
};

export default function PomodoroPage() {
  const [timerState, setTimerState] = useState<{ isRunning: boolean; phase: PomodoroPhase }>({
    isRunning: false,
    phase: "focus",
  });
  const shouldPlay = timerState.isRunning && timerState.phase === "focus";

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Pomodoro</h1>
      <PomodoroTimerCard onStateChange={setTimerState} />
      <MusicPlayer shouldPlay={shouldPlay} />
    </div>
  );
}
