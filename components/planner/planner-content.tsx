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

const styles = {
  root: "space-y-4",
  header: "flex items-center justify-between",
  titleWrap: "inline-block",
  pageTitle: "font-serif text-page-title text-theme-text",
  addEventHeaderButton:
    "glass rounded-xl px-4 py-2 shadow-glass text-small font-medium text-theme-text hover:scale-[1.02] transition-transform",
  monthNav: "flex items-center justify-between glass-card rounded-2xl p-3",
  monthNavArrow: "px-3 py-1 rounded-lg hover:bg-theme-accent/10 text-theme-text text-small",
  monthNavCenter: "flex items-center gap-3",
  monthLabel: "font-serif text-section-title text-theme-text",
  todayButton: "text-caption px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent font-medium",
  calendarShell: "glass-card rounded-2xl p-3 overflow-hidden",
  weekdayRow: "grid grid-cols-7 mb-1",
  weekdayCell: "text-center text-caption font-medium text-theme-text-muted py-1",
  dayGrid: "grid grid-cols-7 gap-px",
  emptyCell: "min-h-[4.5rem] bg-theme-bg/30 rounded-lg",
  dayCell:
    "min-h-[4.5rem] p-1 rounded-lg text-left transition-colors",
  dayCellSelected: "bg-theme-accent/15 ring-1 ring-theme-accent/30",
  dayCellIdle: "hover:bg-theme-accent/5",
  dayNumber: "inline-flex items-center justify-center w-6 h-6 text-caption rounded-full",
  dayNumberToday: "bg-theme-accent text-white font-bold",
  dayNumberDefault: "text-theme-text",
  eventChip:
    "text-[10px] leading-tight text-theme-accent truncate px-1 py-0.5 rounded bg-theme-accent/10",
  eventOverflow: "text-[10px] text-theme-text-muted px-1",
  eventListStack: "mt-0.5 space-y-0.5",
  selectedDayPanel: "glass-card rounded-2xl p-4 space-y-3",
  selectedDayHeader: "flex items-center justify-between",
  selectedDayTitle: "font-serif text-card-title text-theme-text",
  addOnDayLink: "text-small text-theme-accent hover:underline",
  noEvents: "text-small text-theme-text-muted",
  eventList: "space-y-2",
  eventListItemButton:
    "w-full text-left rounded-xl bg-theme-bg p-3 hover:bg-theme-accent/5 transition-colors",
  eventTitle: "block text-small font-medium text-theme-text",
  eventTime: "text-caption text-theme-text-muted",
  eventDescription: "block text-caption text-theme-text-muted mt-1 truncate",
  modalBackdrop:
    "fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm",
  modalCard: "glass-card rounded-3xl p-6 max-w-sm w-full mx-4 space-y-4",
  modalTitle: "font-serif text-section-title text-theme-text",
  modalInput:
    "w-full rounded-xl px-4 py-2.5 text-small bg-theme-bg border border-theme-accent/20 text-theme-text placeholder:text-theme-text-muted/50",
  modalInputNoPlaceholder:
    "w-full rounded-xl px-4 py-2.5 text-small bg-theme-bg border border-theme-accent/20 text-theme-text",
  modalLabel: "flex items-center gap-2 text-small text-theme-text",
  modalCheckbox: "accent-theme-accent",
  timeRow: "flex gap-2",
  timeInput:
    "flex-1 rounded-xl px-3 py-2 text-small bg-theme-bg border border-theme-accent/20 text-theme-text",
  timeRowLabel: "self-center text-theme-text-muted text-small",
  modalTextarea:
    "w-full rounded-xl px-4 py-2.5 text-small bg-theme-bg border border-theme-accent/20 text-theme-text placeholder:text-theme-text-muted/50 resize-none",
  modalActions: "flex gap-2",
  modalPrimaryButton:
    "flex-1 glass rounded-xl px-4 py-2.5 shadow-glass text-small font-medium text-theme-text hover:scale-[1.01] transition-transform disabled:opacity-50",
  modalDeleteButton:
    "px-4 py-2.5 rounded-xl text-small text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors",
  modalCancelButton:
    "px-4 py-2.5 rounded-xl text-small text-theme-text-muted hover:bg-theme-accent/5 transition-colors",

};

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
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h1 className={styles.pageTitle}>Calendar</h1>
        </div>
        <button
          onClick={() => openAddEvent()}
          className={styles.addEventHeaderButton}
        >
          + Add Event
        </button>
      </div>

      {/* Month navigation */}
      <div className={styles.monthNav}>
        <button onClick={prevMonth} className={styles.monthNavArrow}>&larr;</button>
        <div className={styles.monthNavCenter}>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={goToday}
            className={styles.todayButton}
          >
            Today
          </button>
        </div>
        <button onClick={nextMonth} className={styles.monthNavArrow}>&rarr;</button>
      </div>

      {/* Calendar grid */}
      <div className={styles.calendarShell}>
        {/* Day headers */}
        <div className={styles.weekdayRow}>
          {DAYS.map((d) => (
            <div key={d} className={styles.weekdayCell}>
              {d}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className={styles.dayGrid}>
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={i} className={styles.emptyCell} />;
            }
            const dateStr = formatDate(year, month, day);
            const isToday = dateStr === today;
            const dayEvts = eventsForDay(day);
            const isSelected = selectedDay === dateStr;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`${styles.dayCell} ${isSelected ? styles.dayCellSelected : styles.dayCellIdle}`}
              >
                <span
                  className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : styles.dayNumberDefault}`}
                >
                  {day}
                </span>
                <div className={styles.eventListStack}>
                  {dayEvts.slice(0, 2).map((evt) => (
                    <div
                      key={evt.id}
                      className={styles.eventChip}
                    >
                      {evt.title}
                    </div>
                  ))}
                  {dayEvts.length > 2 && (
                    <div className={styles.eventOverflow}>
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
        <div className={styles.selectedDayPanel}>
          <div className={styles.selectedDayHeader}>
            <h3 className={styles.selectedDayTitle}>
              Events for {selectedDay}
            </h3>
            <button
              onClick={() => openAddEvent(selectedDay)}
              className={styles.addOnDayLink}
            >
              + Add
            </button>
          </div>
          {dayEvents.length === 0 ? (
            <p className={styles.noEvents}>No events</p>
          ) : (
            <ul className={styles.eventList}>
              {dayEvents.map((evt) => (
                <li key={evt.id}>
                  <button
                    onClick={() => openEditEvent(evt)}
                    className={styles.eventListItemButton}
                  >
                    <span className={styles.eventTitle}>
                      {evt.title}
                    </span>
                    {!evt.isAllDay && evt.startTime && (
                      <span className={styles.eventTime}>
                        {evt.startTime} - {evt.endTime}
                      </span>
                    )}
                    {evt.isAllDay && (
                      <span className={styles.eventTime}>All day</span>
                    )}
                    {evt.description && (
                      <span className={styles.eventDescription}>
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
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>
              {editingId ? "Edit Event" : "New Event"}
            </h3>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={styles.modalInput}
              placeholder="Event title"
              autoFocus
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={styles.modalInputNoPlaceholder}
            />

            <label className={styles.modalLabel}>
              <input
                type="checkbox"
                checked={form.isAllDay}
                onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })}
                className={styles.modalCheckbox}
              />
              All day
            </label>

            {!form.isAllDay && (
              <div className={styles.timeRow}>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className={styles.timeInput}
                />
                <span className={styles.timeRowLabel}>to</span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className={styles.timeInput}
                />
              </div>
            )}

            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={styles.modalTextarea}
              placeholder="Description (optional)"
              rows={2}
            />

            <div className={styles.modalActions}>
              <button
                onClick={saveEvent}
                disabled={!form.title.trim()}
                className={styles.modalPrimaryButton}
              >
                {editingId ? "Update" : "Create"}
              </button>
              {editingId && (
                <button
                  onClick={deleteEvent}
                  className={styles.modalDeleteButton}
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setModalOpen(false)}
                className={styles.modalCancelButton}
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
