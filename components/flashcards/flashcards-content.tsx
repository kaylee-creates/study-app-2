"use client";

import { useEffect, useState } from "react";
import { localStudyRepository } from "@/lib/storage-local";
import type { Flashcard } from "@/lib/domain";

export function FlashcardsContent() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    localStudyRepository.getFlashcards().then(setCards);
  }, []);

  const current = cards[index];
  const hasCards = cards.length > 0;

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

  return (
    <div className="space-y-6">
      <div className="inline-block">
        <h1 className="font-serif text-2xl text-theme-text">Flashcards</h1>
        <svg className="mt-0.5" width="110" height="8" viewBox="0 0 110 8" fill="none">
          <path d="M2,4 C12,1 24,7 36,4 C48,1 60,7 72,4 C84,1 96,7 108,4" stroke="var(--color-accent-yellow)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {!hasCards && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-base text-theme-text-muted">
            No flashcards yet. Create a study guide and use &quot;Generate
            Flashcards&quot; to add some.
          </p>
        </div>
      )}

      {hasCards && current && (
        <div className="glass-card rounded-2xl max-w-xl mx-auto p-6 space-y-4">
          <p className="text-sm text-theme-text-muted">
            Card {index + 1} of {cards.length}
          </p>
          <p className="font-serif text-lg text-theme-text">{current.question}</p>

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
  );
}
