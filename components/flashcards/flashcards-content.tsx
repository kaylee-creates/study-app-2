"use client";

import { useEffect, useState } from "react";
import { localStudyRepository } from "@/lib/storage-local";
import type { Flashcard } from "@/lib/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
            easeScore: f.easeScore + (rating === "again" ? -0.2 : rating === "good" ? 0.1 : 0.2),
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
      <h1 className="font-handwritten text-3xl text-cozy-ink">Flashcards</h1>
      {!hasCards && (
        <Card>
          <CardContent className="py-8 text-center text-cozy-muted">
            No flashcards yet. Create notes and use &quot;Generate Flashcards&quot; on the Notes page.
          </CardContent>
        </Card>
      )}
      {hasCards && current && (
        <Card className="max-w-xl mx-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-cozy-muted">
              Card {index + 1} of {cards.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-cozy-ink">{current.question}</p>
            {showAnswer ? (
              <>
                <p className="text-cozy-muted border-t border-cozy-grid pt-4">
                  {current.answer}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="destructive" size="sm" onClick={() => recordReview("again")}>
                    Again
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => recordReview("good")}>
                    Good
                  </Button>
                  <Button size="sm" onClick={() => recordReview("easy")}>
                    Easy
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={() => setShowAnswer(true)}>Show answer</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
