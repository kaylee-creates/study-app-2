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

const styles = {
  skeletonRoot: "scrapbook-page min-h-[40vh] animate-pulse rounded-lg p-6",
  skeletonTitle: "mb-6 h-8 w-48 rounded bg-theme-surface",
  skeletonGrid: "grid gap-4 md:grid-cols-2",
  skeletonCard: "h-24 rounded-lg bg-theme-surface",
  root: "space-y-6",
  pageTitle: "font-serif text-page-title text-theme-text",
  statsGrid: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
  cardHeader: "pb-2",
  cardTitle: "text-small font-medium text-theme-text-muted",
  statPrimary: "text-2xl font-semibold text-theme-accent",
  statSecondary: "text-2xl font-semibold text-theme-accent-dark",
  statNeutral: "text-2xl font-semibold text-theme-text",
  statUnit: "text-body font-normal text-theme-text-muted",
  actions: "flex flex-wrap gap-3",
};

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
      <div className={styles.skeletonRoot}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonGrid}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <div className={styles.statsGrid}>
        <Card>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>
              Today&apos;s focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.statPrimary}>
              {stats.todayMinutes}
              <span className={styles.statUnit}> min</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>
              Today&apos;s points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.statSecondary}>
              {stats.todayPoints}
              <span className={styles.statUnit}> pts</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.statNeutral}>
              {stats.upcomingPlanCount}
              <span className={styles.statUnit}> tasks</span>
            </p>
          </CardContent>
        </Card>
      </div>
      <div className={styles.actions}>
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
