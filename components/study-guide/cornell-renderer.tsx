"use client";

import { useState } from "react";

interface CornellRendererProps {
  title: string;
  date: string;
  content: string;
  onSave: (newContent: string) => void;
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
      const label = match[1].toLowerCase() as keyof CornellSections;
      current = label;
      continue;
    }
    if (current) {
      sections[current] += line + "\n";
    }
  }

  for (const key of Object.keys(sections) as (keyof CornellSections)[]) {
    sections[key] = sections[key].trim();
  }

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
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- ") || l.startsWith("* "))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
}

function renderInlineFormatting(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-bold text-theme-text">
        {match[1]}
      </strong>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.length > 0 ? parts : text;
}

// --- Keywords renderer: grouped by topic with bold terms + definitions ---

function KeywordsContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-sm font-bold uppercase tracking-wider text-theme-accent mt-4 mb-2 first:mt-0">
          {trimmed.slice(4)}
        </h4>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.slice(2);
      const dashIdx = content.indexOf(" -- ");
      if (dashIdx !== -1) {
        const term = content.slice(0, dashIdx);
        const def = content.slice(dashIdx + 4);
        elements.push(
          <div key={i} className="mb-2 ml-1">
            <span className="text-lg font-bold text-theme-text">
              {renderInlineFormatting(term)}
            </span>
            <p className="text-sm text-theme-text-muted leading-snug mt-0.5">{def}</p>
          </div>
        );
      } else {
        elements.push(
          <div key={i} className="mb-2 ml-1">
            <span className="text-lg font-bold text-theme-text">
              {renderInlineFormatting(content)}
            </span>
          </div>
        );
      }
    } else if (trimmed !== "") {
      elements.push(
        <p key={i} className="text-base text-theme-text">{trimmed}</p>
      );
    }
  });

  return <>{elements}</>;
}

// --- Notes renderer: subheadings, numbered lists, nested sub-points ---

function NotesContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-lg font-serif font-bold text-theme-text mt-5 mb-2 first:mt-0">
          {trimmed.slice(4)}
        </h4>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s*/, "");
      elements.push(
        <li key={i} className="ml-5 list-decimal text-base leading-relaxed text-theme-text font-medium">
          {renderInlineFormatting(content)}
        </li>
      );
    } else if ((trimmed.startsWith("- ") || trimmed.startsWith("* ")) && indent >= 2) {
      elements.push(
        <li key={i} className="ml-10 list-disc text-sm leading-relaxed text-theme-text-muted">
          {renderInlineFormatting(trimmed.slice(2))}
        </li>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-5 list-disc text-base leading-relaxed text-theme-text">
          {renderInlineFormatting(trimmed.slice(2))}
        </li>
      );
    } else if (trimmed === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-base leading-relaxed text-theme-text">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    }
  });

  return <>{elements}</>;
}

// --- Simple section content for Summary ---

function SectionContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <li key={i} className="ml-4 list-disc text-base leading-relaxed text-theme-text">
              {trimmed.slice(2)}
            </li>
          );
        }
        if (trimmed === "") return <br key={i} />;
        return (
          <p key={i} className="text-base leading-relaxed text-theme-text">
            {trimmed}
          </p>
        );
      })}
    </>
  );
}

// --- Interactive Questions ---

function InteractiveQuestions({
  questions,
  notesContext,
}: {
  questions: string[];
  notesContext: string;
}) {
  const [answers, setAnswers] = useState<QuizAnswer[]>(() =>
    questions.map(() => ({
      answer: "",
      checked: false,
      loading: false,
      correct: false,
      feedback: "",
    }))
  );

  async function checkAnswer(idx: number) {
    const q = questions[idx];
    const a = answers[idx];
    if (!a.answer.trim()) return;

    setAnswers((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, loading: true } : item))
    );

    try {
      const res = await fetch("/api/ai/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          answer: a.answer,
          context: notesContext,
        }),
      });
      const data = await res.json();
      setAnswers((prev) =>
        prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                checked: true,
                loading: false,
                correct: !!data.correct,
                feedback: data.feedback || "",
              }
            : item
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
                feedback: "Failed to check answer.",
              }
            : item
        )
      );
    }
  }

  function resetQuiz() {
    setAnswers(
      questions.map(() => ({
        answer: "",
        checked: false,
        loading: false,
        correct: false,
        feedback: "",
      }))
    );
  }

  const checkedCount = answers.filter((a) => a.checked).length;
  const correctCount = answers.filter((a) => a.checked && a.correct).length;

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className="space-y-1.5">
          <p className="text-base font-medium text-theme-text">{q}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={answers[i].answer}
              onChange={(e) =>
                setAnswers((prev) =>
                  prev.map((item, j) =>
                    j === i ? { ...item, answer: e.target.value, checked: false } : item
                  )
                )
              }
              disabled={answers[i].loading}
              placeholder="Type your answer..."
              className="flex-1 rounded-lg px-3 py-1.5 bg-theme-bg border border-theme-accent/20 text-theme-text text-sm focus:outline-none focus:border-theme-accent disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter") checkAnswer(i);
              }}
            />
            <button
              onClick={() => checkAnswer(i)}
              disabled={answers[i].loading || !answers[i].answer.trim()}
              className="px-3 py-1.5 rounded-lg bg-theme-accent/10 text-theme-accent text-xs font-medium hover:bg-theme-accent/20 transition-colors disabled:opacity-50"
            >
              {answers[i].loading ? "..." : "Check"}
            </button>
          </div>
          {answers[i].checked && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                answers[i].correct
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              <span className="font-medium">
                {answers[i].correct ? "Correct!" : "Incorrect."}
              </span>{" "}
              {answers[i].feedback}
            </div>
          )}
        </div>
      ))}

      {questions.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-theme-accent/10">
          {checkedCount > 0 && (
            <span className="text-sm text-theme-text-muted">
              {correctCount}/{checkedCount} correct
            </span>
          )}
          <button
            onClick={resetQuiz}
            className="text-xs text-theme-accent hover:underline ml-auto"
          >
            Reset Quiz
          </button>
        </div>
      )}
    </div>
  );
}

// --- Main component ---

export function CornellRenderer({ title, date, content, onSave }: CornellRendererProps) {
  const [sections, setSections] = useState(() => parseSections(content));
  const [editing, setEditing] = useState<keyof CornellSections | null>(null);
  const [editValue, setEditValue] = useState("");

  const questions = parseQuestions(sections.questions);

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

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const sectionLabel = "font-serif text-lg font-semibold text-theme-accent mb-2";
  const editBtn =
    "ml-2 text-xs text-theme-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity";

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header: Title + Date */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-theme-accent/20">
        <div>
          <h2 className="font-serif text-2xl font-bold text-theme-text">{title}</h2>
          <div className="mt-1 h-1 w-20 rounded-full bg-theme-accent/40" />
        </div>
        <span className="text-sm text-theme-text-muted italic">{formatDate(date)}</span>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-[1fr_3fr] min-h-[300px]">
        {/* Left column */}
        <div className="border-r border-theme-accent/20 flex flex-col">
          {/* Keywords */}
          <div className="group p-4 flex-1 border-b border-theme-accent/20">
            <div className="flex items-center">
              <h3 className={sectionLabel}>Keywords</h3>
              {editing !== "keywords" && (
                <button onClick={() => startEdit("keywords")} className={editBtn}>
                  Edit
                </button>
              )}
            </div>
            {editing === "keywords" ? (
              <EditArea value={editValue} onChange={setEditValue} onSave={saveEdit} onCancel={cancelEdit} />
            ) : (
              <KeywordsContent text={sections.keywords} />
            )}
          </div>

          {/* Questions */}
          <div className="group p-4 flex-1">
            <div className="flex items-center">
              <h3 className={sectionLabel}>Questions</h3>
              {editing !== "questions" && (
                <button onClick={() => startEdit("questions")} className={editBtn}>
                  Edit
                </button>
              )}
            </div>
            {editing === "questions" ? (
              <EditArea value={editValue} onChange={setEditValue} onSave={saveEdit} onCancel={cancelEdit} />
            ) : (
              <InteractiveQuestions
                questions={questions}
                notesContext={sections.notes}
              />
            )}
          </div>
        </div>

        {/* Right column: Notes */}
        <div className="group p-5">
          <div className="flex items-center">
            <h3 className={sectionLabel}>Notes</h3>
            {editing !== "notes" && (
              <button onClick={() => startEdit("notes")} className={editBtn}>
                Edit
              </button>
            )}
          </div>
          {editing === "notes" ? (
            <EditArea value={editValue} onChange={setEditValue} onSave={saveEdit} onCancel={cancelEdit} rows={12} />
          ) : (
            <NotesContent text={sections.notes} />
          )}
        </div>
      </div>

      {/* Summary footer */}
      <div className="group border-t border-theme-accent/20 px-6 py-4">
        <div className="flex items-center">
          <h3 className="font-serif text-xl font-bold text-theme-text tracking-wide uppercase">
            Summary
          </h3>
          {editing !== "summary" && (
            <button onClick={() => startEdit("summary")} className={editBtn}>
              Edit
            </button>
          )}
        </div>
        <div className="mt-2">
          {editing === "summary" ? (
            <EditArea value={editValue} onChange={setEditValue} onSave={saveEdit} onCancel={cancelEdit} rows={3} />
          ) : (
            <SectionContent text={sections.summary} />
          )}
        </div>
      </div>
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
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg px-3 py-2 bg-theme-bg border border-theme-accent/20 text-theme-text text-base focus:outline-none focus:border-theme-accent resize-y"
      />
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="px-3 py-1 rounded-lg bg-theme-accent/10 text-theme-accent text-xs font-medium hover:bg-theme-accent/20 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 rounded-lg text-theme-text-muted text-xs font-medium hover:bg-theme-accent/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
