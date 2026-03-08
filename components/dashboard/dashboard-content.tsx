"use client";

import { useEffect, useState } from "react";
import { localStudyRepository } from "@/lib/storage-local";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  todayMinutes: number;
  todayPoints: number;
  upcomingPlanCount: number;
}

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function load() {
      const [sessions, planItems, settings] = await Promise.all([
        localStudyRepository.getPomodoroSessions(),
        localStudyRepository.getPlanItems(),
        localStudyRepository.getPomodoroSettings(),
      ]);
      const today = new Date().toISOString().slice(0, 10);
      const todaySessions = sessions.filter(
        (s) => s.endedAt && s.endedAt.startsWith(today) && s.isCompleted
      );
      const todayMinutes = todaySessions.reduce((a, s) => a + s.durationMinutes, 0);
      const todayPoints = todaySessions.reduce((a, s) => a + s.pointsEarned, 0);
      const upcomingPlanCount = planItems.filter(
        (p) => p.scheduledFor >= today && p.status === "pending"
      ).length;
      setStats({
        todayMinutes,
        todayPoints,
        upcomingPlanCount,
      });
    }
    load();
  }, []);

  if (stats === null) {
    return (
      <div className="scrapbook-page min-h-[40vh] rounded-lg p-6 animate-pulse">
        <div className="h-8 w-48 bg-cozy-grid rounded mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-24 bg-cozy-grid rounded-lg" />
          <div className="h-24 bg-cozy-grid rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-handwritten text-3xl text-cozy-ink">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cozy-muted">
              Today&apos;s focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-cozy-clover">
              {stats.todayMinutes}
              <span className="text-base font-normal text-cozy-muted"> min</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cozy-muted">
              Today&apos;s points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-cozy-terracotta">
              {stats.todayPoints}
              <span className="text-base font-normal text-cozy-muted"> pts</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cozy-muted">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-cozy-ink">
              {stats.upcomingPlanCount}
              <span className="text-base font-normal text-cozy-muted"> tasks</span>
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/pomodoro">Start Pomodoro</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/notes">Notes & AI</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/flashcards">Review Flashcards</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/planner">Planner</Link>
        </Button>
      </div>
    </div>
  );
}
