"use client";

import { useCallback, useEffect, useState } from "react";
import { localStudyRepository } from "@/lib/storage-local";
import type { Flashcard } from "@/lib/domain";

export function FlashcardsContent() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"library" | "review">("library");
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  const loadCards = useCallback(async () => {
    const data = await localStudyRepository.getFlashcards();
    setCards(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    const onFocus = () => loadCards();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadCards]);

  const hasCards = cards.length > 0;
  const current = cards[index];

  async function deleteCard(id: string) {
    const state = await localStudyRepository.loadStudyState();
    const next = state.flashcards.filter((f) => f.id !== id);
    await localStudyRepository.saveStudyState({ flashcards: next });
    setCards(next);
    if (editingId === id) setEditingId(null);
  }

  function startEdit(card: Flashcard) {
    setEditingId(card.id);
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
  }

  async function saveEdit(id: string) {
    if (!editQuestion.trim() || !editAnswer.trim()) return;
    const state = await localStudyRepository.loadStudyState();
    const next = state.flashcards.map((f) =>
      f.id === id ? { ...f, question: editQuestion.trim(), answer: editAnswer.trim() } : f
    );
    await localStudyRepository.saveStudyState({ flashcards: next });
    setCards(next);
    setEditingId(null);
  }

  async function recordReview(rating: "again" | "good" | "easy") {
    if (!current) return;
    const state = await localStudyRepository.loadStudyState();
    const next = state.flashcards.map((f) =>
      f.id === current.id
        ? {
            ...f,
            lastReviewedAt: new Date().toISOString(),
            easeScore:
              f.easeScore +
              (rating === "again" ? -0.2 : rating === "good" ? 0.1 : 0.2),
          }
        : f
    );
    await localStudyRepository.saveStudyState({ flashcards: next });
    setCards(next);
    setShowAnswer(false);
    setIndex((i) => (i + 1) % next.length);
  }

  function startReview() {
    setIndex(0);
    setShowAnswer(false);
    setView("review");
  }

  return (
    <div className="space-y-6">
      <div className="inline-block">
        <h1 className="font-serif text-3xl text-theme-text">Flashcards</h1>
        <svg className="mt-0.5" width="110" height="8" viewBox="0 0 110 8" fill="none">
          <path d="M2,4 C12,1 24,7 36,4 C48,1 60,7 72,4 C84,1 96,7 108,4" stroke="var(--color-accent-yellow)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {loading && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-base text-theme-text-muted">Loading flashcards...</p>
        </div>
      )}

      {!loading && !hasCards && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-base text-theme-text-muted">
            No flashcards yet. Create a study guide and use &quot;Generate
            Flashcards&quot; to add some.
          </p>
        </div>
      )}

      {!loading && hasCards && view === "library" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-theme-text-muted">{cards.length} card{cards.length !== 1 ? "s" : ""}</p>
            <button
              onClick={startReview}
              className="glass rounded-xl px-5 py-2 shadow-glass text-sm font-medium text-theme-text hover:scale-[1.02] transition-transform"
            >
              Start Review
            </button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {cards.map((card) => (
              <div key={card.id} className="glass-card rounded-xl p-4 space-y-2">
                {editingId === card.id ? (
                  <div className="space-y-2">
                    <input
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 bg-theme-bg border border-theme-accent/20 text-theme-text text-sm focus:outline-none focus:border-theme-accent"
                      placeholder="Question"
                    />
                    <input
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 bg-theme-bg border border-theme-accent/20 text-theme-text text-sm focus:outline-none focus:border-theme-accent"
                      placeholder="Answer"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(card.id)}
                        className="px-3 py-1 rounded-lg bg-theme-accent/10 text-theme-accent text-xs font-medium hover:bg-theme-accent/20 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded-lg text-theme-text-muted text-xs font-medium hover:bg-theme-accent/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-theme-text">{card.question}</p>
                    <p className="text-sm text-theme-text-muted line-clamp-2">{card.answer}</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => startEdit(card)}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-theme-accent hover:bg-theme-accent/10 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCard(card.id)}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && hasCards && view === "review" && (
        <div className="space-y-4">
          <button
            onClick={() => setView("library")}
            className="text-sm text-theme-accent hover:underline"
          >
            &larr; Back to Library
          </button>

          {current && (
            <div className="glass-card rounded-2xl max-w-xl mx-auto p-6 space-y-4">
              <p className="text-sm text-theme-text-muted">
                Card {index + 1} of {cards.length}
              </p>
              <p className="font-serif text-xl text-theme-text">{current.question}</p>

              {showAnswer ? (
                <>
                  <div className="border-t border-theme-accent/20 pt-4">
                    <p className="text-base text-theme-text-muted">{current.answer}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => recordReview("again")}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      Again
                    </button>
                    <button
                      onClick={() => recordReview("good")}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-theme-accent/10 text-theme-accent hover:bg-theme-accent/20 transition-colors"
                    >
                      Good
                    </button>
                    <button
                      onClick={() => recordReview("easy")}
                      className="px-4 py-2 rounded-xl text-sm font-medium glass shadow-glass text-theme-text hover:scale-[1.02] transition-transform"
                    >
                      Easy
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="glass rounded-xl px-6 py-2.5 shadow-glass text-base font-medium text-theme-text hover:scale-[1.02] transition-transform"
                >
                  Show Answer
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
