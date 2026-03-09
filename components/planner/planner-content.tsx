"use client";

import { useCallback, useEffect, useState } from "react";
import { localStudyRepository, generateId } from "@/lib/storage-local";
import type { PlanItem } from "@/lib/domain";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface EventFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  isAllDay: boolean;
}

const emptyForm = (date?: string): EventFormData => ({
  title: "",
  date: date || new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  endTime: "10:00",
  description: "",
  isAllDay: false,
});

export function PlannerContent() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [items, setItems] = useState<PlanItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    localStudyRepository.getPlanItems().then(setItems);
  }, []);

  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsForDay = useCallback(
    (day: number) => {
      const dateStr = formatDate(year, month, day);
      return items.filter((it) => it.scheduledFor === dateStr);
    },
    [items, year, month]
  );

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const openAddEvent = (date?: string) => {
    setEditingId(null);
    setForm(emptyForm(date));
    setModalOpen(true);
  };

  const openEditEvent = (item: PlanItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      date: item.scheduledFor,
      startTime: item.startTime || "09:00",
      endTime: item.endTime || "10:00",
      description: item.description || "",
      isAllDay: item.isAllDay ?? false,
    });
    setModalOpen(true);
  };

  const saveEvent = async () => {
    if (!form.title.trim()) return;
    const state = await localStudyRepository.loadStudyState();

    if (editingId) {
      const updated = state.planItems.map((p) =>
        p.id === editingId
          ? {
              ...p,
              title: form.title.trim(),
              scheduledFor: form.date,
              startTime: form.isAllDay ? undefined : form.startTime,
              endTime: form.isAllDay ? undefined : form.endTime,
              description: form.description,
              isAllDay: form.isAllDay,
            }
          : p
      );
      await localStudyRepository.saveStudyState({ planItems: updated });
      setItems(updated);
    } else {
      const newItem: PlanItem = {
        id: generateId(),
        trackId: null,
        title: form.title.trim(),
        scheduledFor: form.date,
        status: "pending",
        startTime: form.isAllDay ? undefined : form.startTime,
        endTime: form.isAllDay ? undefined : form.endTime,
        description: form.description,
        isAllDay: form.isAllDay,
      };
      const next = [...state.planItems, newItem];
      await localStudyRepository.saveStudyState({ planItems: next });
      setItems(next);
    }
    setModalOpen(false);
  };

  const deleteEvent = async () => {
    if (!editingId) return;
    const state = await localStudyRepository.loadStudyState();
    const next = state.planItems.filter((p) => p.id !== editingId);
    await localStudyRepository.saveStudyState({ planItems: next });
    setItems(next);
    setModalOpen(false);
  };

  const dayEvents = selectedDay
    ? items.filter((it) => it.scheduledFor === selectedDay)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-theme-text">Calendar</h1>
        <button
          onClick={() => openAddEvent()}
          className="glass rounded-xl px-4 py-2 shadow-glass text-xs font-medium text-theme-text hover:scale-[1.02] transition-transform"
        >
          + Add Event
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between glass-card rounded-2xl p-3">
        <button onClick={prevMonth} className="px-3 py-1 rounded-lg hover:bg-theme-accent/10 text-theme-text text-sm">&larr;</button>
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg text-theme-text">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={goToday}
            className="text-[10px] px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent font-medium"
          >
            Today
          </button>
        </div>
        <button onClick={nextMonth} className="px-3 py-1 rounded-lg hover:bg-theme-accent/10 text-theme-text text-sm">&rarr;</button>
      </div>

      {/* Calendar grid */}
      <div className="glass-card rounded-2xl p-3 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-theme-text-muted py-1">
              {d}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={i} className="min-h-[4.5rem] bg-theme-bg/30 rounded-lg" />;
            }
            const dateStr = formatDate(year, month, day);
            const isToday = dateStr === today;
            const dayEvts = eventsForDay(day);
            const isSelected = selectedDay === dateStr;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`min-h-[4.5rem] p-1 rounded-lg text-left transition-colors ${
                  isSelected
                    ? "bg-theme-accent/15 ring-1 ring-theme-accent/30"
                    : "hover:bg-theme-accent/5"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                    isToday
                      ? "bg-theme-accent text-white font-bold"
                      : "text-theme-text"
                  }`}
                >
                  {day}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvts.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      className="text-[9px] leading-tight text-theme-accent truncate px-1 py-0.5 rounded bg-theme-accent/10"
                    >
                      {evt.title}
                    </div>
                  ))}
                  {dayEvts.length > 2 && (
                    <div className="text-[9px] text-theme-text-muted px-1">
                      +{dayEvts.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm text-theme-text">
              Events for {selectedDay}
            </h3>
            <button
              onClick={() => openAddEvent(selectedDay)}
              className="text-xs text-theme-accent hover:underline"
            >
              + Add
            </button>
          </div>
          {dayEvents.length === 0 ? (
            <p className="text-xs text-theme-text-muted">No events</p>
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((evt) => (
                <li key={evt.id}>
                  <button
                    onClick={() => openEditEvent(evt)}
                    className="w-full text-left rounded-xl bg-theme-bg p-3 hover:bg-theme-accent/5 transition-colors"
                  >
                    <span className="block text-sm font-medium text-theme-text">
                      {evt.title}
                    </span>
                    {!evt.isAllDay && evt.startTime && (
                      <span className="text-xs text-theme-text-muted">
                        {evt.startTime} - {evt.endTime}
                      </span>
                    )}
                    {evt.isAllDay && (
                      <span className="text-xs text-theme-text-muted">All day</span>
                    )}
                    {evt.description && (
                      <span className="block text-xs text-theme-text-muted mt-1 truncate">
                        {evt.description}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Event modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-serif text-lg text-theme-text">
              {editingId ? "Edit Event" : "New Event"}
            </h3>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm bg-theme-bg border border-theme-accent/20 text-theme-text placeholder:text-theme-text-muted/50"
              placeholder="Event title"
              autoFocus
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm bg-theme-bg border border-theme-accent/20 text-theme-text"
            />

            <label className="flex items-center gap-2 text-sm text-theme-text">
              <input
                type="checkbox"
                checked={form.isAllDay}
                onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })}
                className="accent-theme-accent"
              />
              All day
            </label>

            {!form.isAllDay && (
              <div className="flex gap-2">
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="flex-1 rounded-xl px-3 py-2 text-sm bg-theme-bg border border-theme-accent/20 text-theme-text"
                />
                <span className="self-center text-theme-text-muted text-sm">to</span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="flex-1 rounded-xl px-3 py-2 text-sm bg-theme-bg border border-theme-accent/20 text-theme-text"
                />
              </div>
            )}

            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl px-4 py-2.5 text-sm bg-theme-bg border border-theme-accent/20 text-theme-text placeholder:text-theme-text-muted/50 resize-none"
              placeholder="Description (optional)"
              rows={2}
            />

            <div className="flex gap-2">
              <button
                onClick={saveEvent}
                disabled={!form.title.trim()}
                className="flex-1 glass rounded-xl px-4 py-2.5 shadow-glass text-sm font-medium text-theme-text hover:scale-[1.01] transition-transform disabled:opacity-50"
              >
                {editingId ? "Update" : "Create"}
              </button>
              {editingId && (
                <button
                  onClick={deleteEvent}
                  className="px-4 py-2.5 rounded-xl text-sm text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-theme-text-muted hover:bg-theme-accent/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
