import { PomodoroTimerCard } from "@/components/pomodoro/pomodoro-timer-card";
import { MusicPlayer } from "@/components/music-player";

export default function PomodoroPage() {
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="font-serif text-3xl text-theme-text text-center">Pomodoro</h1>
      <PomodoroTimerCard />
      <MusicPlayer />
    </div>
  );
}
