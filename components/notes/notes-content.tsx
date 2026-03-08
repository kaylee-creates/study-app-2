"use client";

import { useEffect, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { localStudyRepository, generateId } from "@/lib/storage-local";
import type { Note } from "@/lib/domain";
import type { AiFlashcardSuggestion } from "@/lib/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-6">
      <h1 className="font-handwritten text-3xl text-cozy-ink">Notes & AI</h1>
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="secondary" size="sm" onClick={createNew}>
              New note
            </Button>
            {notes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNoteId(n.id)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selectedId === n.id ? "bg-cozy-grid" : "hover:bg-cozy-grid/60"
                }`}
              >
                {n.title || "Untitled"}
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {selected ? "Edit" : "Select or create a note"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected && (
              <>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border border-cozy-grid bg-cozy-paper px-3 py-2 text-cozy-ink"
                  placeholder="Title"
                />
                <textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  className="min-h-[200px] w-full rounded border border-cozy-grid bg-cozy-paper px-3 py-2 text-cozy-ink"
                  placeholder="Write your note..."
                />
                <div className="flex flex-wrap gap-2">
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
                  <div className="rounded-lg border border-cozy-grid bg-cozy-paper/80 p-4">
                    <p className="text-sm font-medium text-cozy-muted mb-2">Summary</p>
                    <p className="text-cozy-ink whitespace-pre-wrap text-sm">{summary}</p>
                  </div>
                )}
                {suggestedCards.length > 0 && (
                  <div className="rounded-lg border border-cozy-grid bg-cozy-paper/80 p-4 space-y-2">
                    <p className="text-sm font-medium text-cozy-muted">
                      Add to deck
                    </p>
                    <ul className="space-y-2">
                      {suggestedCards.map((c, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="text-cozy-ink">
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
