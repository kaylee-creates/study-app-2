"use client";

import { useCallback, useEffect, useState } from "react";
import { localStudyRepository, generateId } from "@/lib/storage-local";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const POINTS_PER_FOCUS_MINUTE = 2;

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function calculatePoints(durationMinutes: number, isFocus: boolean): number {
  if (!isFocus) return 0;
  return Math.round(durationMinutes * POINTS_PER_FOCUS_MINUTE);
}

export function PomodoroTimerCard() {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<"focus" | "break">("focus");

  const handleComplete = useCallback(async () => {
    if (phase === "focus" && focusMinutes > 0) {
      const durationMinutes = focusMinutes;
      const points = calculatePoints(durationMinutes, true);
      const session = {
        id: generateId(),
        trackId: null,
        startedAt: new Date(Date.now() - durationMinutes * 60 * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        durationMinutes,
        isCompleted: true,
        pointsEarned: points,
        label: "Focus",
      };
      const state = await localStudyRepository.loadStudyState();
      await localStudyRepository.saveStudyState({
        pomodoroSessions: [...state.pomodoroSessions, session],
      });
    }
    setPhase((p) => (p === "focus" ? "break" : "focus"));
    setRemainingSeconds(phase === "focus" ? 5 * 60 : focusMinutes * 60);
  }, [phase, focusMinutes]);

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

  const toggle = () => {
    setIsRunning((r) => !r);
  };

  const reset = () => {
    setIsRunning(false);
    setRemainingSeconds(focusMinutes * 60);
    setPhase("focus");
  };

  const totalSeconds = phase === "focus" ? focusMinutes * 60 : 5 * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  return (
    <Card className="max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-cozy-ink">
          {phase === "focus" ? "Focus" : "Break"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-4xl font-mono text-cozy-clover tabular-nums">
          {formatSeconds(remainingSeconds)}
        </p>
        <Progress value={progress} className="h-2" />
        <div className="flex gap-2">
          <Button onClick={toggle}>{isRunning ? "Pause" : "Start"}</Button>
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
        {!isRunning && phase === "focus" && (
          <div className="flex items-center gap-2 text-sm text-cozy-muted">
            <span>Focus length:</span>
            <select
              value={focusMinutes}
              onChange={(e) => {
                const m = Number(e.target.value);
                setFocusMinutes(m);
                setRemainingSeconds(m * 60);
              }}
              className="rounded border border-cozy-grid bg-cozy-paper px-2 py-1"
            >
              {[15, 25, 45].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
