"use client";

import { useEffect, useState } from "react";
import { localStudyRepository, generateId } from "@/lib/storage-local";
import type { PlanItem, PlanItemStatus } from "@/lib/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PlannerContent() {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    localStudyRepository.getPlanItems().then(setItems);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const byDay = items.reduce<Record<string, PlanItem[]>>((acc, item) => {
    const d = item.scheduledFor;
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});
  const sortedDays = Object.keys(byDay).sort();

  async function addItem() {
    if (!newTitle.trim()) return;
    const item: PlanItem = {
      id: generateId(),
      trackId: null,
      title: newTitle.trim(),
      scheduledFor: newDate,
      status: "pending",
    };
    const state = await localStudyRepository.loadStudyState();
    await localStudyRepository.saveStudyState({
      planItems: [...state.planItems, item],
    });
    setItems([...state.planItems, item]);
    setNewTitle("");
  }

  async function toggleStatus(id: string) {
    const state = await localStudyRepository.loadStudyState();
    const next = state.planItems.map((p) =>
      p.id === id
        ? {
            ...p,
            status: (p.status === "done" ? "pending" : "done") as PlanItemStatus,
          }
        : p
    );
    await localStudyRepository.saveStudyState({ planItems: next });
    setItems(next);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-handwritten text-3xl text-cozy-ink">Planner</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Add task</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title"
            className="rounded border border-cozy-grid bg-cozy-paper px-3 py-2 text-cozy-ink min-w-[180px]"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded border border-cozy-grid bg-cozy-paper px-3 py-2 text-cozy-ink"
          />
          <Button onClick={addItem}>Add</Button>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {sortedDays.length === 0 && (
          <p className="text-sm text-cozy-muted">No planned tasks yet.</p>
        )}
        {sortedDays.map((day) => (
          <Card key={day}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {day === today ? "Today" : day}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byDay[day].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={item.status === "done"}
                    onChange={() => toggleStatus(item.id)}
                    className="rounded border-cozy-grid"
                  />
                  <span
                    className={
                      item.status === "done"
                        ? "text-cozy-muted line-through"
                        : "text-cozy-ink"
                    }
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
