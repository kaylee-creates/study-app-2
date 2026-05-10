"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { HighlightColor, NotepadEntry } from "@/lib/domain";

interface CornellRendererProps {
  guideId?: string;
  guideTitle: string;
  title: string;
  date: string;
  content: string;
  notepadEntries: NotepadEntry[];
  onSave: (newContent: string) => void;
  onCreateNotepadEntry?: (
    text: string,
    color: HighlightColor,
    note: string
  ) => void | Promise<void>;
}

interface CornellSections {
  keywords: string;
  questions: string;
  notes: string;
  summary: string;
}

interface QuizAnswer {
  answer: string;
  checked: boolean;
  loading: boolean;
  correct: boolean;
  feedback: string;
}

const styles = {
  cardRoot: "glass-card overflow-hidden rounded-2xl",
  bodyStack: "space-y-4 p-4",
  header: "flex items-center justify-between border-b border-theme-accent/20 px-6 py-4",
  headerDate: "text-small italic text-theme-text-muted",
  headerTitle: "font-serif text-2xl font-bold text-theme-text",
  headerTitleUnderline: "mt-1 h-1 w-20 rounded-full bg-theme-accent/40",

  cornellFrame: "overflow-hidden rounded-xl border-2 border-theme-accent/35 bg-theme-bg/35",
  cornellTop: "grid md:grid-cols-[minmax(0,30%)_minmax(0,70%)] md:max-h-[58vh]",
  cornellCueColumn:
    "border-b border-theme-accent/35 p-4 md:h-[58vh] md:overflow-y-auto md:border-b-0 md:border-r themed-scrollbar",
  cornellNotesColumn: "relative p-4",
  cornellSummaryRow: "border-t-2 border-theme-accent/35 p-4",
  cornellTitle: "font-serif text-section-title font-bold text-theme-accent",
  cornellSubTitle: "mt-4 mb-2 font-serif text-card-title font-semibold text-theme-accent",

  editAreaRoot: "space-y-2",
  editActions: "flex gap-2",
  editButton:
    "ml-2 text-caption text-theme-accent opacity-0 transition-opacity hover:underline group-hover:opacity-100",
  editCancelButton:
    "rounded-lg px-3 py-1 text-caption font-medium text-theme-text-muted transition-colors hover:bg-theme-accent/10",
  editSaveButton:
    "rounded-lg bg-theme-accent/10 px-3 py-1 text-caption font-medium text-theme-accent transition-colors hover:bg-theme-accent/20",
  editTextarea:
    "w-full resize-y rounded-lg border border-theme-accent/20 bg-theme-bg px-3 py-2 text-body text-theme-text focus:border-theme-accent focus:outline-none",

  inlineStrong: "font-bold text-theme-text",
  keywordBlock: "mb-2 ml-1",
  keywordDefinition: "mt-0.5 text-small leading-snug text-theme-text-muted",
  keywordTerm: "text-card-title font-bold text-theme-text",
  keywordsParagraph: "text-body text-theme-text",
  keywordsSubheading:
    "mt-4 mb-2 first:mt-0 text-small font-bold uppercase tracking-wider text-theme-accent",

  notesListBullet: "ml-5 list-disc text-body leading-relaxed text-theme-text",
  notesListNested: "ml-10 list-disc text-small leading-relaxed text-theme-text-muted",
  notesListNumbered: "ml-5 list-decimal text-body font-medium leading-relaxed text-theme-text",
  notesParagraph: "text-body leading-relaxed text-theme-text",
  notesSpacer: "h-2",
  notesSubheading: "mt-5 mb-2 first:mt-0 text-card-title font-serif font-bold text-theme-text",

  sectionHeaderRow: "group flex items-center",
  sectionListItem: "ml-4 list-disc text-body leading-relaxed text-theme-text",
  sectionParagraph: "text-body leading-relaxed text-theme-text",
  summaryContent: "mt-2",

  quizCheckButton:
    "rounded-lg bg-theme-accent/10 px-3 py-1.5 text-caption font-medium text-theme-accent transition-colors hover:bg-theme-accent/20 disabled:opacity-50",
  quizFeedbackCorrect:
    "rounded-lg bg-green-500/10 px-3 py-2 text-small text-green-600 dark:text-green-400",
  quizFeedbackIncorrect: "rounded-lg bg-red-500/10 px-3 py-2 text-small text-red-600 dark:text-red-400",
  quizFeedbackLabel: "font-medium",
  quizFooter: "flex items-center justify-between border-t border-theme-accent/10 pt-2",
  quizInput:
    "flex-1 rounded-lg border border-theme-accent/20 bg-theme-bg px-3 py-1.5 text-small text-theme-text focus:border-theme-accent focus:outline-none disabled:opacity-50",
  quizInputRow: "flex gap-2",
  quizQuestionBlock: "space-y-1.5",
  quizQuestionText: "text-body font-medium text-theme-text",
  quizResetButton: "ml-auto text-caption text-theme-accent hover:underline",
  quizRoot: "space-y-4",
  quizScore: "text-small text-theme-text-muted",

  selectionPopup:
    "fixed z-[60] w-72 rounded-xl border border-theme-accent/25 bg-theme-bg p-3 shadow-lg backdrop-blur-sm",
  selectionLabel: "text-caption text-theme-text-muted",
  colorRow: "mt-2 flex flex-wrap gap-2",
  colorChip: "h-6 w-6 rounded-full border border-white/60 transition-transform hover:scale-105",
  popupInput:
    "mt-2 w-full rounded-lg border border-theme-accent/20 bg-theme-bg px-3 py-2 text-small text-theme-text focus:border-theme-accent focus:outline-none",
  popupActions: "mt-2 flex items-center justify-end gap-2",
  popupSave:
    "rounded-lg bg-theme-accent/10 px-3 py-1 text-caption font-medium text-theme-accent transition-colors hover:bg-theme-accent/20 disabled:opacity-50",
  popupCancel:
    "rounded-lg px-3 py-1 text-caption font-medium text-theme-text-muted transition-colors hover:bg-theme-accent/10",
};

const DEFAULT_INCORRECT_FEEDBACK =
  "That answer does not match the notes. Review the key concept and try again.";

const colorMarkClass: Record<HighlightColor, string> = {
  pink: "bg-pink-300/60",
  orange: "bg-orange-300/60",
  yellow: "bg-yellow-300/60",
  green: "bg-green-300/60",
  blue: "bg-blue-300/60",
  purple: "bg-purple-300/60",
};

const colorChipClass: Record<HighlightColor, string> = {
  pink: "bg-pink-400",
  orange: "bg-orange-400",
  yellow: "bg-yellow-400",
  green: "bg-green-400",
  blue: "bg-blue-400",
  purple: "bg-purple-400",
};

function normalizeQuizFeedback(rawFeedback: unknown, correct: boolean): string {
  if (typeof rawFeedback !== "string") {
    return correct ? "Nice work. Your answer matches the notes." : DEFAULT_INCORRECT_FEEDBACK;
  }
  const text = rawFeedback.trim();
  if (!text) return correct ? "Nice work. Your answer matches the notes." : DEFAULT_INCORRECT_FEEDBACK;
  if ((text.startsWith("{") || text.startsWith("[")) && !correct) return DEFAULT_INCORRECT_FEEDBACK;
  return text;
}

function parseSections(content: string): CornellSections {
  const sections: CornellSections = {
    keywords: "",
    questions: "",
    notes: "",
    summary: "",
  };
  const sectionPattern = /^## (Keywords|Questions|Notes|Summary)\s*$/im;
  const lines = content.split("\n");
  let current: keyof CornellSections | null = null;

  for (const line of lines) {
    const match = line.match(sectionPattern);
    if (match) {
      current = match[1].toLowerCase() as keyof CornellSections;
      continue;
    }
    if (current) sections[current] += `${line}\n`;
  }

  (Object.keys(sections) as (keyof CornellSections)[]).forEach((key) => {
    sections[key] = sections[key].trim();
  });
  return sections;
}

function rebuildContent(sections: CornellSections): string {
  return [
    `## Keywords\n\n${sections.keywords}`,
    `## Questions\n\n${sections.questions}`,
    `## Notes\n\n${sections.notes}`,
    `## Summary\n\n${sections.summary}`,
  ].join("\n\n");
}

function parseQuestions(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- ") || line.startsWith("* "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function renderInlineFormatting(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <strong key={`${match.index}-${match[1]}`} className={styles.inlineStrong}>
        {match[1]}
      </strong>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

function findHighlightsInText(text: string, entries: NotepadEntry[]) {
  const matches: { start: number; end: number; entry: NotepadEntry }[] = [];
  const lower = text.toLowerCase();
  for (const entry of entries) {
    const query = entry.text.trim().toLowerCase();
    if (!query) continue;
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(query, from);
      if (idx === -1) break;
      matches.push({ start: idx, end: idx + query.length, entry });
      from = idx + query.length;
    }
  }
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: typeof matches = [];
  for (const match of matches) {
    const last = merged[merged.length - 1];
    if (!last || match.start >= last.end) merged.push(match);
  }
  return merged;
}

function renderHighlightedText(text: string, entries: NotepadEntry[]) {
  if (entries.length === 0) return renderInlineFormatting(text);
  const matches = findHighlightsInText(text, entries);
  if (matches.length === 0) return renderInlineFormatting(text);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, index) => {
    if (match.start > cursor) {
      nodes.push(text.slice(cursor, match.start));
    }
    nodes.push(
      <mark
        key={`${match.entry.id}-${index}`}
        className={`rounded px-1 ${colorMarkClass[match.entry.color]}`}
        title={match.entry.note || undefined}
      >
        {text.slice(match.start, match.end)}
      </mark>
    );
    cursor = match.end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function KeywordsContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={i} className={styles.keywordsSubheading}>
              {trimmed.slice(4)}
            </h4>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.slice(2);
          const splitIdx = content.indexOf(" -- ");
          if (splitIdx !== -1) {
            return (
              <div key={i} className={styles.keywordBlock}>
                <span className={styles.keywordTerm}>
                  {renderInlineFormatting(content.slice(0, splitIdx))}
                </span>
                <p className={styles.keywordDefinition}>{content.slice(splitIdx + 4)}</p>
              </div>
            );
          }
          return (
            <div key={i} className={styles.keywordBlock}>
              <span className={styles.keywordTerm}>{renderInlineFormatting(content)}</span>
            </div>
          );
        }
        if (!trimmed) return null;
        return (
          <p key={i} className={styles.keywordsParagraph}>
            {trimmed}
          </p>
        );
      })}
    </>
  );
}

function NotesContent({ text, highlights }: { text: string; highlights: NotepadEntry[] }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const indent = line.length - line.trimStart().length;
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={i} className={styles.notesSubheading}>
              {trimmed.slice(4)}
            </h4>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <li key={i} className={styles.notesListNumbered}>
              {renderHighlightedText(trimmed.replace(/^\d+\.\s*/, ""), highlights)}
            </li>
          );
        }
        if ((trimmed.startsWith("- ") || trimmed.startsWith("* ")) && indent >= 2) {
          return (
            <li key={i} className={styles.notesListNested}>
              {renderHighlightedText(trimmed.slice(2), highlights)}
            </li>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li key={i} className={styles.notesListBullet}>
              {renderHighlightedText(trimmed.slice(2), highlights)}
            </li>
          );
        }
        if (!trimmed) return <div key={i} className={styles.notesSpacer} />;
        return (
          <p key={i} className={styles.notesParagraph}>
            {renderHighlightedText(trimmed, highlights)}
          </p>
        );
      })}
    </>
  );
}

function SectionContent({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li key={i} className={styles.sectionListItem}>
              {trimmed.slice(2)}
            </li>
          );
        }
        if (!trimmed) return <br key={i} />;
        return (
          <p key={i} className={styles.sectionParagraph}>
            {trimmed}
          </p>
        );
      })}
    </>
  );
}

function InteractiveQuestions({
  questions,
  notesContext,
}: {
  questions: string[];
  notesContext: string;
}) {
  const [answers, setAnswers] = useState<QuizAnswer[]>(
    questions.map(() => ({ answer: "", checked: false, loading: false, correct: false, feedback: "" }))
  );

  useEffect(() => {
    setAnswers(
      questions.map(() => ({ answer: "", checked: false, loading: false, correct: false, feedback: "" }))
    );
  }, [questions]);

  async function checkAnswer(idx: number) {
    const current = answers[idx];
    if (!current?.answer.trim()) return;

    setAnswers((prev) => prev.map((item, i) => (i === idx ? { ...item, loading: true } : item)));
    try {
      const res = await fetch("/api/ai/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[idx],
          answer: current.answer,
          context: notesContext,
        }),
      });
      if (!res.ok) throw new Error("Failed to check answer");
      const data = (await res.json()) as { correct?: boolean; feedback?: unknown };
      const correct = !!data.correct;
      const feedback = normalizeQuizFeedback(data.feedback, correct);
      setAnswers((prev) =>
        prev.map((item, i) =>
          i === idx ? { ...item, checked: true, loading: false, correct, feedback } : item
        )
      );
    } catch {
      setAnswers((prev) =>
        prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                checked: true,
                loading: false,
                correct: false,
                feedback: "Could not verify answer. Please try again.",
              }
            : item
        )
      );
    }
  }

  return (
    <div className={styles.quizRoot}>
      {questions.map((question, i) => (
        <div key={i} className={styles.quizQuestionBlock}>
          <p className={styles.quizQuestionText}>{question}</p>
          <div className={styles.quizInputRow}>
            <input
              type="text"
              value={answers[i]?.answer ?? ""}
              onChange={(e) =>
                setAnswers((prev) =>
                  prev.map((item, j) => (j === i ? { ...item, answer: e.target.value, checked: false } : item))
                )
              }
              disabled={answers[i]?.loading}
              placeholder="Type your answer..."
              className={styles.quizInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") checkAnswer(i);
              }}
            />
            <button
              onClick={() => checkAnswer(i)}
              disabled={answers[i]?.loading || !answers[i]?.answer.trim()}
              className={styles.quizCheckButton}
            >
              {answers[i]?.loading ? "..." : "Check"}
            </button>
          </div>
          {answers[i]?.checked && (
            <div className={answers[i].correct ? styles.quizFeedbackCorrect : styles.quizFeedbackIncorrect}>
              <span className={styles.quizFeedbackLabel}>
                {answers[i].correct ? "Correct!" : "Incorrect."}
              </span>{" "}
              {answers[i].feedback}
            </div>
          )}
        </div>
      ))}
      {questions.length > 0 && (
        <div className={styles.quizFooter}>
          <span className={styles.quizScore}>
            {answers.filter((a) => a.checked && a.correct).length}/{answers.filter((a) => a.checked).length} correct
          </span>
          <button
            onClick={() =>
              setAnswers(
                questions.map(() => ({ answer: "", checked: false, loading: false, correct: false, feedback: "" }))
              )
            }
            className={styles.quizResetButton}
          >
            Reset Quiz
          </button>
        </div>
      )}
    </div>
  );
}

export function CornellRenderer({
  guideId,
  guideTitle,
  title,
  date,
  content,
  notepadEntries,
  onSave,
  onCreateNotepadEntry,
}: CornellRendererProps) {
  const [sections, setSections] = useState(() => parseSections(content));
  const [editing, setEditing] = useState<keyof CornellSections | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectedColor, setSelectedColor] = useState<HighlightColor>("yellow");
  const [selectionNote, setSelectionNote] = useState("");
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);

  const notesAreaRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const questions = useMemo(() => parseQuestions(sections.questions), [sections.questions]);
  const guideEntries = useMemo(
    () => notepadEntries.filter((entry) => (guideId ? entry.guideId === guideId : false)),
    [guideId, notepadEntries]
  );

  useEffect(() => {
    setSections(parseSections(content));
    setEditing(null);
    setEditValue("");
  }, [content]);

  useEffect(() => {
    function onDocMouseDown(event: MouseEvent) {
      if (!popupPos) return;
      const target = event.target as Node;
      if (popupRef.current?.contains(target)) return;
      setPopupPos(null);
    }
    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setPopupPos(null);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [popupPos]);

  function startEdit(section: keyof CornellSections) {
    setEditing(section);
    setEditValue(sections[section]);
  }

  function cancelEdit() {
    setEditing(null);
    setEditValue("");
  }

  function saveEdit() {
    if (editing === null) return;
    const updated = { ...sections, [editing]: editValue.trim() };
    setSections(updated);
    onSave(rebuildContent(updated));
    setEditing(null);
    setEditValue("");
  }

  function captureSelection() {
    if (!notesAreaRef.current || editing === "notes") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    if (!notesAreaRef.current.contains(container)) return;

    const text = selection.toString().replace(/\s+/g, " ").trim();
    if (!text) return;

    const rect = range.getBoundingClientRect();
    setSelectedText(text);
    setSelectionNote("");
    setPopupPos({
      top: Math.max(16, rect.top - 12),
      left: Math.min(window.innerWidth - 180, Math.max(16, rect.left + rect.width / 2)),
    });
  }

  async function saveSelectedHighlight() {
    if (!selectedText || !onCreateNotepadEntry) return;
    await onCreateNotepadEntry(selectedText, selectedColor, selectionNote);
    setPopupPos(null);
    setSelectionNote("");
    window.getSelection()?.removeAllRanges();
  }

  const formattedDate = (() => {
    try {
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return date;
    }
  })();

  return (
    <div className={styles.cardRoot}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>{title}</h2>
          <div className={styles.headerTitleUnderline} />
        </div>
        <span className={styles.headerDate}>{formattedDate}</span>
      </div>

      <div className={styles.bodyStack}>
        <div className={styles.cornellFrame}>
          <div className={styles.cornellTop}>
            <div className={styles.cornellCueColumn}>
              <h3 className={styles.cornellTitle}>Cue column</h3>
              <div className={styles.sectionHeaderRow}>
                <h4 className={styles.cornellSubTitle}>Key words</h4>
                {editing !== "keywords" && (
                  <button onClick={() => startEdit("keywords")} className={styles.editButton}>
                    Edit
                  </button>
                )}
              </div>
              {editing === "keywords" ? (
                <EditArea value={editValue} onChange={setEditValue} onSave={saveEdit} onCancel={cancelEdit} />
              ) : (
                <KeywordsContent text={sections.keywords} />
              )}

              <div className={styles.sectionHeaderRow}>
                <h4 className={styles.cornellSubTitle}>Key questions</h4>
                {editing !== "questions" && (
                  <button onClick={() => startEdit("questions")} className={styles.editButton}>
                    Edit
                  </button>
                )}
              </div>
              {editing === "questions" ? (
                <EditArea value={editValue} onChange={setEditValue} onSave={saveEdit} onCancel={cancelEdit} />
              ) : (
                <InteractiveQuestions questions={questions} notesContext={sections.notes} />
              )}
            </div>

            <div ref={notesAreaRef} className={styles.cornellNotesColumn} onMouseUp={captureSelection}>
              <div className={styles.sectionHeaderRow}>
                <h3 className={styles.cornellTitle}>Note-taking column</h3>
                {editing !== "notes" && (
                  <button onClick={() => startEdit("notes")} className={styles.editButton}>
                    Edit
                  </button>
                )}
              </div>
              <p className={styles.sectionParagraph}>Source: {guideTitle}</p>
              {editing === "notes" ? (
                <EditArea
                  value={editValue}
                  onChange={setEditValue}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  rows={12}
                />
              ) : (
                <NotesContent text={sections.notes} highlights={guideEntries} />
              )}
            </div>
          </div>

          <div className={styles.cornellSummaryRow}>
            <div className={styles.sectionHeaderRow}>
              <h3 className={styles.cornellTitle}>Summary</h3>
              {editing !== "summary" && (
                <button onClick={() => startEdit("summary")} className={styles.editButton}>
                  Edit
                </button>
              )}
            </div>
            <div className={styles.summaryContent}>
              {editing === "summary" ? (
                <EditArea value={editValue} onChange={setEditValue} onSave={saveEdit} onCancel={cancelEdit} rows={3} />
              ) : (
                <SectionContent text={sections.summary} />
              )}
            </div>
          </div>
        </div>
      </div>

      {popupPos && (
        <div
          ref={popupRef}
          className={styles.selectionPopup}
          style={{ top: popupPos.top, left: popupPos.left, transform: "translate(-50%, -100%)" }}
        >
          <p className={styles.selectionLabel}>Save highlighted text</p>
          <p className={styles.sectionParagraph}>{selectedText}</p>
          <div className={styles.colorRow}>
            {(Object.keys(colorChipClass) as HighlightColor[]).map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Set color ${color}`}
                className={`${styles.colorChip} ${colorChipClass[color]} ${
                  selectedColor === color ? "ring-2 ring-theme-accent" : ""
                }`}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
          <textarea
            value={selectionNote}
            onChange={(e) => setSelectionNote(e.target.value)}
            rows={2}
            placeholder="Optional note..."
            className={styles.popupInput}
          />
          <div className={styles.popupActions}>
            <button type="button" className={styles.popupCancel} onClick={() => setPopupPos(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.popupSave}
              onClick={saveSelectedHighlight}
              disabled={!selectedText || !onCreateNotepadEntry}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditArea({
  value,
  onChange,
  onSave,
  onCancel,
  rows = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  rows?: number;
}) {
  return (
    <div className={styles.editAreaRoot}>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={styles.editTextarea} />
      <div className={styles.editActions}>
        <button onClick={onSave} className={styles.editSaveButton}>
          Save
        </button>
        <button onClick={onCancel} className={styles.editCancelButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}
