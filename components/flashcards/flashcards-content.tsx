"use client";

import { useCallback, useEffect, useState } from "react";
import { localStudyRepository } from "@/lib/storage-local";
import type { Flashcard } from "@/lib/domain";

const styles = {
  root: "space-y-6",
  titleWrap: "inline-block",
  pageTitle: "font-serif text-page-title text-theme-text",
  titleUnderline: "mt-0.5",
  emptyStateCard: "glass-card rounded-2xl p-8 text-center",
  mutedBody: "text-body text-theme-text-muted",
  librarySection: "space-y-4",
  libraryToolbar: "flex items-center justify-between",
  cardCount: "text-small text-theme-text-muted",
  startReviewButton:
    "glass rounded-xl px-5 py-2 shadow-glass text-small font-medium text-theme-text hover:scale-[1.02] transition-transform",
  cardList: "space-y-2 max-h-[60vh] overflow-y-auto pr-1",
  cardRow: "glass-card rounded-xl p-4 space-y-2",
  editForm: "space-y-2",
  editInput:
    "w-full rounded-lg px-3 py-2 bg-theme-bg border border-theme-accent/20 text-theme-text text-small focus:outline-none focus:border-theme-accent",
  editActions: "flex gap-2",
  saveButton:
    "px-3 py-1 rounded-lg bg-theme-accent/10 text-theme-accent text-caption font-medium hover:bg-theme-accent/20 transition-colors",
  cancelEditButton:
    "px-3 py-1 rounded-lg text-theme-text-muted text-caption font-medium hover:bg-theme-accent/10 transition-colors",
  questionText: "text-small font-medium text-theme-text",
  answerPreview: "text-small text-theme-text-muted line-clamp-2",
  cardActions: "flex gap-2 pt-1",
  editButton:
    "px-3 py-1 rounded-lg text-caption font-medium text-theme-accent hover:bg-theme-accent/10 transition-colors",
  deleteButton:
    "px-3 py-1 rounded-lg text-caption font-medium text-red-500 hover:bg-red-500/10 transition-colors",
  backLink: "text-small text-theme-accent hover:underline",
  reviewCard: "glass-card rounded-2xl max-w-xl mx-auto p-6 space-y-4",
  reviewProgress: "text-small text-theme-text-muted",
  reviewQuestion: "font-serif text-section-title text-theme-text",
  answerSection: "border-t border-theme-accent/20 pt-4",
  answerText: "text-body text-theme-text-muted",
  ratingRow: "flex gap-2 flex-wrap",
  againButton:
    "px-4 py-2 rounded-xl text-small font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors",
  goodButton:
    "px-4 py-2 rounded-xl text-small font-medium bg-theme-accent/10 text-theme-accent hover:bg-theme-accent/20 transition-colors",
  easyButton:
    "px-4 py-2 rounded-xl text-small font-medium glass shadow-glass text-theme-text hover:scale-[1.02] transition-transform",
  showAnswerButton:
    "glass rounded-xl px-6 py-2.5 shadow-glass text-body font-medium text-theme-text hover:scale-[1.02] transition-transform",
};

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
    <div className={styles.root}>
      <div className={styles.titleWrap}>
        <h1 className={styles.pageTitle}>Flashcards</h1>
        <svg className={styles.titleUnderline} width="110" height="8" viewBox="0 0 110 8" fill="none">
          <path d="M2,4 C12,1 24,7 36,4 C48,1 60,7 72,4 C84,1 96,7 108,4" stroke="var(--color-accent-yellow)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {loading && (
        <div className={styles.emptyStateCard}>
          <p className={styles.mutedBody}>Loading flashcards...</p>
        </div>
      )}

      {!loading && !hasCards && (
        <div className={styles.emptyStateCard}>
          <p className={styles.mutedBody}>
            No flashcards yet. Create a study guide and use &quot;Generate
            Flashcards&quot; to add some.
          </p>
        </div>
      )}

      {!loading && hasCards && view === "library" && (
        <div className={styles.librarySection}>
          <div className={styles.libraryToolbar}>
            <p className={styles.cardCount}>{cards.length} card{cards.length !== 1 ? "s" : ""}</p>
            <button
              onClick={startReview}
              className={styles.startReviewButton}
            >
              Start Review
            </button>
          </div>

          <div className={styles.cardList}>
            {cards.map((card) => (
              <div key={card.id} className={styles.cardRow}>
                {editingId === card.id ? (
                  <div className={styles.editForm}>
                    <input
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className={styles.editInput}
                      placeholder="Question"
                    />
                    <input
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className={styles.editInput}
                      placeholder="Answer"
                    />
                    <div className={styles.editActions}>
                      <button
                        onClick={() => saveEdit(card.id)}
                        className={styles.saveButton}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className={styles.cancelEditButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={styles.questionText}>{card.question}</p>
                    <p className={styles.answerPreview}>{card.answer}</p>
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => startEdit(card)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCard(card.id)}
                        className={styles.deleteButton}
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
        <div className={styles.librarySection}>
          <button
            onClick={() => setView("library")}
            className={styles.backLink}
          >
            &larr; Back to Library
          </button>

          {current && (
            <div className={styles.reviewCard}>
              <p className={styles.reviewProgress}>
                Card {index + 1} of {cards.length}
              </p>
              <p className={styles.reviewQuestion}>{current.question}</p>

              {showAnswer ? (
                <>
                  <div className={styles.answerSection}>
                    <p className={styles.answerText}>{current.answer}</p>
                  </div>
                  <div className={styles.ratingRow}>
                    <button
                      onClick={() => recordReview("again")}
                      className={styles.againButton}
                    >
                      Again
                    </button>
                    <button
                      onClick={() => recordReview("good")}
                      className={styles.goodButton}
                    >
                      Good
                    </button>
                    <button
                      onClick={() => recordReview("easy")}
                      className={styles.easyButton}
                    >
                      Easy
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className={styles.showAnswerButton}
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
