import { ScrapbookCanvas } from "@/components/scrapbook/scrapbook-canvas";
import { PomodoroTimerCard } from "@/components/pomodoro/pomodoro-timer-card";

export default function PomodoroPage() {
  return (
    <ScrapbookCanvas pageId="pomodoro">
      <div className="space-y-6">
        <h1 className="font-handwritten text-3xl text-cozy-ink">Pomodoro</h1>
        <PomodoroTimerCard />
      </div>
    </ScrapbookCanvas>
  );
}
