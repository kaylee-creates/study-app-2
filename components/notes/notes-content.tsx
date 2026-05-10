"use client";

import { useEffect, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { localStudyRepository, generateId } from "@/lib/storage-local";
import type { Note } from "@/lib/domain";
import type { AiFlashcardSuggestion } from "@/lib/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const styles = {
  root: "space-y-6",
  pageTitle: "font-serif text-page-title text-theme-text",
  layout: "grid gap-4 md:grid-cols-[220px_1fr]",
  cardHeaderTight: "pb-2",
  cardTitleSm: "text-small",
  listContent: "space-y-2",
  noteListItem:
    "block w-full rounded-lg px-3 py-2 text-left text-small",
  noteListItemSelected: "bg-theme-accent/10",
  noteListItemIdle: "hover:bg-theme-accent/5",
  editorContent: "space-y-4",
  titleInput:
    "w-full rounded border border-theme-accent/20 bg-theme-bg px-3 py-2 text-theme-text",
  bodyTextarea:
    "min-h-[200px] w-full rounded border border-theme-accent/20 bg-theme-bg px-3 py-2 text-theme-text",
  actionRow: "flex flex-wrap gap-2",
  summaryBox: "rounded-lg border border-theme-accent/20 bg-theme-surface/80 p-4",
  summaryLabel: "mb-2 text-small font-medium text-theme-text-muted",
  summaryBody: "whitespace-pre-wrap text-small text-theme-text",
  flashcardBox: "space-y-2 rounded-lg border border-theme-accent/20 bg-theme-surface/80 p-4",
  flashcardHeading: "text-small font-medium text-theme-text-muted",
  flashcardList: "space-y-2",
  flashcardRow: "flex items-center justify-between gap-2 text-small",
  flashcardQuestion: "text-theme-text",
};

export function NotesContent() {
  const [noteId, setNoteId] = useQueryState("noteId", parseAsString.withDefault(""));
  const selectedId = noteId || null;
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [suggestedCards, setSuggestedCards] = useState<AiFlashcardSuggestion[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);

  useEffect(() => {
    localStudyRepository.getNotes().then(setNotes);
  }, []);

  const selected = notes.find((n) => n.id === selectedId);

  useEffect(() => {
    if (selected) {
      setTitle(selected.title);
      setRawContent(selected.rawContent);
    } else {
      setTitle("");
      setRawContent("");
    }
  }, [selected]);

  async function save() {
    if (!selectedId) return;
    const state = await localStudyRepository.loadStudyState();
    const next = state.notes.map((n) =>
      n.id === selectedId
        ? { ...n, title, rawContent, updatedAt: new Date().toISOString() }
        : n
    );
    await localStudyRepository.saveStudyState({ notes: next });
    setNotes(next);
  }

  async function summarize() {
    if (!rawContent.trim()) return;
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: rawContent,
          lengthPreference: "medium",
        }),
      });
      const data = await res.json();
      if (res.ok && typeof data.summary === "string") setSummary(data.summary);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function generateFlashcards() {
    if (!rawContent.trim()) return;
    setFlashcardsLoading(true);
    setSuggestedCards([]);
    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: rawContent, count: 5 }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.cards)) setSuggestedCards(data.cards);
    } finally {
      setFlashcardsLoading(false);
    }
  }

  async function addFlashcardToDeck(card: AiFlashcardSuggestion) {
    const state = await localStudyRepository.loadStudyState();
    const newCard = {
      id: generateId(),
      noteId: selectedId ?? null,
      trackId: null,
      question: card.question,
      answer: card.answer,
      createdAt: new Date().toISOString(),
      lastReviewedAt: null,
      easeScore: 1,
    };
    await localStudyRepository.saveStudyState({
      flashcards: [...state.flashcards, newCard],
    });
    setSuggestedCards((prev) => prev.filter((c) => c !== card));
  }

  async function createNew() {
    const id = generateId();
    const note: Note = {
      id,
      trackId: null,
      title: "Untitled",
      rawContent: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "manual",
    };
    const state = await localStudyRepository.loadStudyState();
    await localStudyRepository.saveStudyState({
      notes: [...state.notes, note],
    });
    setNotes([...state.notes, note]);
    setNoteId(id);
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.pageTitle}>Notes & AI</h1>
      <div className={styles.layout}>
        <Card>
          <CardHeader className={styles.cardHeaderTight}>
            <CardTitle className={styles.cardTitleSm}>Notes</CardTitle>
          </CardHeader>
          <CardContent className={styles.listContent}>
            <Button variant="secondary" size="sm" onClick={createNew}>
              New note
            </Button>
            {notes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNoteId(n.id)}
                className={`${styles.noteListItem} ${
                  selectedId === n.id ? styles.noteListItemSelected : styles.noteListItemIdle
                }`}
              >
                {n.title || "Untitled"}
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={styles.cardHeaderTight}>
            <CardTitle className={styles.cardTitleSm}>
              {selected ? "Edit" : "Select or create a note"}
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.editorContent}>
            {selected && (
              <>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.titleInput}
                  placeholder="Title"
                />
                <textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  className={styles.bodyTextarea}
                  placeholder="Write your note..."
                />
                <div className={styles.actionRow}>
                  <Button onClick={save}>Save</Button>
                  <Button
                    variant="secondary"
                    onClick={summarize}
                    disabled={summaryLoading || !rawContent.trim()}
                  >
                    {summaryLoading ? "Summarizing…" : "Summarize with AI"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={generateFlashcards}
                    disabled={flashcardsLoading || !rawContent.trim()}
                  >
                    {flashcardsLoading ? "Generating…" : "Generate flashcards"}
                  </Button>
                </div>
                {summary !== null && (
                  <div className={styles.summaryBox}>
                    <p className={styles.summaryLabel}>Summary</p>
                    <p className={styles.summaryBody}>{summary}</p>
                  </div>
                )}
                {suggestedCards.length > 0 && (
                  <div className={styles.flashcardBox}>
                    <p className={styles.flashcardHeading}>
                      Add to deck
                    </p>
                    <ul className={styles.flashcardList}>
                      {suggestedCards.map((c, i) => (
                        <li
                          key={i}
                          className={styles.flashcardRow}
                        >
                          <span className={styles.flashcardQuestion}>
                            Q: {c.question}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addFlashcardToDeck(c)}
                          >
                            Add
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
