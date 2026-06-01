"use client";

import { useCallback, useEffect, useState } from "react";
import { CornellRenderer } from "@/components/study-guide/cornell-renderer";
import { QuestionsRenderer } from "@/components/study-guide/questions-renderer";
import type {
  AiFlashcardSuggestion,
  HighlightColor,
  MemoryTip,
  NotepadEntry,
  TopicResult,
} from "@/lib/domain";

type PlanTab = "overview" | "cornell" | "flashcards" | "quiz" | "tips";

const TAB_OPTIONS: { value: PlanTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "cornell", label: "Cornell Notes" },
  { value: "flashcards", label: "Flashcards" },
  { value: "quiz", label: "Practice Quiz" },
  { value: "tips", label: "Memory Tips" },
];

const TECHNIQUE_LABEL: Record<MemoryTip["technique"], string> = {
  acronym: "Acronym",
  rhyme: "Rhyme",
  mnemonic: "Mnemonic",
  chunking: "Chunking",
};

const styles = {
  root: "space-y-4",
  tabBar: "flex flex-wrap gap-2",
  tabButton: "glass-card rounded-xl px-3 py-2 text-small transition-colors",
  tabButtonActive: "border-theme-accent text-theme-accent",
  tabButtonIdle: "text-theme-text-muted hover:border-theme-accent/50",

  panel: "space-y-4",
  card: "glass-card rounded-2xl p-6 space-y-4",
  loadingRow: "flex items-center gap-3 text-theme-text-muted",
  loadingSpinner:
    "h-5 w-5 animate-spin rounded-full border-2 border-theme-accent/30 border-t-theme-accent",
  errorText: "text-small text-red-500",
  retryButton: "text-small text-theme-accent hover:underline",

  overviewHeading: "font-serif text-card-title text-theme-text",
  overviewScore: "font-serif text-section-title text-theme-text",
  overviewSubtle: "text-small text-theme-text-muted",
  topicList: "space-y-2",
  topicRow:
    "flex items-center justify-between rounded-xl border border-theme-accent/15 bg-theme-bg/60 px-4 py-2",
  topicName: "text-body text-theme-text",
  topicScoreWeak: "text-small font-medium text-rose-500",
  topicScoreStrong: "text-small font-medium text-emerald-500",
  weakChips: "flex flex-wrap gap-2",
  weakChip:
    "rounded-full bg-rose-400/15 px-3 py-1 text-small font-medium text-rose-500",
  encourage:
    "rounded-xl border border-emerald-500/30 bg-emerald-400/10 px-4 py-3 text-body text-emerald-600 dark:text-emerald-400",

  flashcardGrid: "grid gap-3 sm:grid-cols-2",
  flashcardItem:
    "rounded-xl border border-theme-accent/15 bg-theme-bg/60 p-4 space-y-2",
  flashcardQuestion: "text-body font-medium text-theme-text",
  flashcardAnswer: "text-small text-theme-text-muted",
  primaryButton:
    "glass rounded-2xl px-6 py-3 shadow-glass font-serif text-body font-medium text-theme-text hover:scale-[1.01] transition-transform disabled:opacity-50",
  savedNote: "text-small text-emerald-500",

  tipList: "space-y-3",
  tipItem: "rounded-xl border border-theme-accent/15 bg-theme-bg/60 p-4 space-y-1",
  tipHeader: "flex items-center gap-2",
  tipTechnique:
    "rounded-full bg-theme-accent/10 px-2 py-0.5 text-caption font-medium text-theme-accent",
  tipTopic: "text-body font-medium text-theme-text",
  tipText: "text-small text-theme-text-muted",
};

interface StudyPlanProps {
  guideId?: string;
  title: string;
  date: string;
  rawSource: string;
  results: TopicResult[];
  weakTopics: string[];
  notepadEntries: NotepadEntry[];
  cornellContent?: string;
  onCornellContentChange?: (content: string) => void;
  onCreateNotepadEntry?: (
    text: string,
    color: HighlightColor,
    note: string
  ) => void | Promise<void>;
  onSaveFlashcards: (cards: AiFlashcardSuggestion[]) => Promise<void>;
}

export function StudyPlan({
  guideId,
  title,
  date,
  rawSource,
  results,
  weakTopics,
  notepadEntries,
  cornellContent,
  onCornellContentChange,
  onCreateNotepadEntry,
  onSaveFlashcards,
}: StudyPlanProps) {
  const [activeTab, setActiveTab] = useState<PlanTab>("overview");

  const [cornell, setCornell] = useState(cornellContent ?? "");
  const [cornellLoading, setCornellLoading] = useState(false);
  const [cornellError, setCornellError] = useState("");

  const [quiz, setQuiz] = useState("");
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");

  const [flashcards, setFlashcards] = useState<AiFlashcardSuggestion[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [flashcardsError, setFlashcardsError] = useState("");
  const [flashcardsSaving, setFlashcardsSaving] = useState(false);
  const [flashcardsSaved, setFlashcardsSaved] = useState(false);

  const [tips, setTips] = useState<MemoryTip[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState("");

  const loadCornell = useCallback(async () => {
    if (cornell || cornellLoading) return;
    setCornellLoading(true);
    setCornellError("");
    try {
      const res = await fetch("/api/ai/study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: rawSource, format: "cornell", focusTopics: weakTopics }),
      });
      const data = await res.json();
      if (!res.ok || !data.result) {
        setCornellError("Could not generate notes. Please try again.");
        return;
      }
      setCornell(data.result);
      onCornellContentChange?.(data.result);
    } catch {
      setCornellError("Failed to generate notes. Please try again.");
    } finally {
      setCornellLoading(false);
    }
  }, [cornell, cornellLoading, onCornellContentChange, rawSource, weakTopics]);

  const loadQuiz = useCallback(async () => {
    if (quiz || quizLoading) return;
    setQuizLoading(true);
    setQuizError("");
    try {
      const res = await fetch("/api/ai/study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: rawSource, format: "questions", focusTopics: weakTopics }),
      });
      const data = await res.json();
      if (!res.ok || !data.result) {
        setQuizError("Could not generate a practice quiz. Please try again.");
        return;
      }
      setQuiz(data.result);
    } catch {
      setQuizError("Failed to generate a practice quiz. Please try again.");
    } finally {
      setQuizLoading(false);
    }
  }, [quiz, quizLoading, rawSource, weakTopics]);

  const loadFlashcards = useCallback(async () => {
    if (flashcards.length > 0 || flashcardsLoading) return;
    setFlashcardsLoading(true);
    setFlashcardsError("");
    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: rawSource, count: 6, focusTopics: weakTopics }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.cards) || data.cards.length === 0) {
        setFlashcardsError("Could not generate flashcards. Please try again.");
        return;
      }
      setFlashcards(data.cards);
    } catch {
      setFlashcardsError("Failed to generate flashcards. Please try again.");
    } finally {
      setFlashcardsLoading(false);
    }
  }, [flashcards.length, flashcardsLoading, rawSource, weakTopics]);

  const loadTips = useCallback(async () => {
    if (tips.length > 0 || tipsLoading) return;
    setTipsLoading(true);
    setTipsError("");
    try {
      const res = await fetch("/api/ai/memory-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: rawSource, focusTopics: weakTopics }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.tips) || data.tips.length === 0) {
        setTipsError("Could not generate memory tips. Please try again.");
        return;
      }
      setTips(data.tips);
    } catch {
      setTipsError("Failed to generate memory tips. Please try again.");
    } finally {
      setTipsLoading(false);
    }
  }, [tips.length, tipsLoading, rawSource, weakTopics]);

  useEffect(() => {
    if (activeTab === "cornell") void loadCornell();
    if (activeTab === "quiz") void loadQuiz();
    if (activeTab === "flashcards") void loadFlashcards();
    if (activeTab === "tips") void loadTips();
  }, [activeTab, loadCornell, loadQuiz, loadFlashcards, loadTips]);

  const handleSaveFlashcards = async () => {
    if (flashcards.length === 0) return;
    setFlashcardsSaving(true);
    try {
      await onSaveFlashcards(flashcards);
      setFlashcardsSaved(true);
    } finally {
      setFlashcardsSaving(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.tabBar}>
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`${styles.tabButton} ${
              activeTab === tab.value ? styles.tabButtonActive : styles.tabButtonIdle
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewPanel results={results} weakTopics={weakTopics} />
      )}

      {activeTab === "cornell" && (
        <div className={styles.panel}>
          {cornellLoading ? (
            <LoadingCard label="Building your Cornell notes..." />
          ) : cornellError ? (
            <ErrorCard message={cornellError} onRetry={loadCornell} />
          ) : cornell ? (
            <CornellRenderer
              guideId={guideId}
              guideTitle={title}
              title={title}
              date={date}
              content={cornell}
              notepadEntries={notepadEntries}
              onCreateNotepadEntry={onCreateNotepadEntry}
              onSave={(newContent) => {
                setCornell(newContent);
                onCornellContentChange?.(newContent);
              }}
            />
          ) : null}
        </div>
      )}

      {activeTab === "flashcards" && (
        <div className={styles.panel}>
          {flashcardsLoading ? (
            <LoadingCard label="Generating flashcards..." />
          ) : flashcardsError ? (
            <ErrorCard message={flashcardsError} onRetry={loadFlashcards} />
          ) : (
            <div className={styles.card}>
              <div className={styles.flashcardGrid}>
                {flashcards.map((card, index) => (
                  <div key={`${card.question}-${index}`} className={styles.flashcardItem}>
                    <p className={styles.flashcardQuestion}>{card.question}</p>
                    <p className={styles.flashcardAnswer}>{card.answer}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSaveFlashcards}
                disabled={flashcardsSaving || flashcards.length === 0}
                className={styles.primaryButton}
              >
                {flashcardsSaving ? "Saving..." : "Save & open Cards"}
              </button>
              {flashcardsSaved && (
                <p className={styles.savedNote}>Saved to your flashcards.</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "quiz" && (
        <div className={styles.panel}>
          {quizLoading ? (
            <LoadingCard label="Building a focused practice quiz..." />
          ) : quizError ? (
            <ErrorCard message={quizError} onRetry={loadQuiz} />
          ) : quiz ? (
            <QuestionsRenderer content={quiz} />
          ) : null}
        </div>
      )}

      {activeTab === "tips" && (
        <div className={styles.panel}>
          {tipsLoading ? (
            <LoadingCard label="Finding ways to help you remember..." />
          ) : tipsError ? (
            <ErrorCard message={tipsError} onRetry={loadTips} />
          ) : (
            <div className={styles.card}>
              <div className={styles.tipList}>
                {tips.map((tip, index) => (
                  <div key={`${tip.topic}-${index}`} className={styles.tipItem}>
                    <div className={styles.tipHeader}>
                      <span className={styles.tipTechnique}>
                        {TECHNIQUE_LABEL[tip.technique]}
                      </span>
                      <span className={styles.tipTopic}>{tip.topic}</span>
                    </div>
                    <p className={styles.tipText}>{tip.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OverviewPanel({
  results,
  weakTopics,
}: {
  results: TopicResult[];
  weakTopics: string[];
}) {
  const totalCorrect = results.reduce((sum, result) => sum + result.correct, 0);
  const totalQuestions = results.reduce((sum, result) => sum + result.total, 0);

  return (
    <div className={styles.card}>
      <div>
        <p className={styles.overviewSubtle}>Your diagnostic result</p>
        <p className={styles.overviewScore}>
          {totalCorrect}/{totalQuestions} correct
        </p>
      </div>

      {weakTopics.length > 0 ? (
        <div className="space-y-2">
          <p className={styles.overviewHeading}>Focus areas</p>
          <div className={styles.weakChips}>
            {weakTopics.map((topic) => (
              <span key={topic} className={styles.weakChip}>
                {topic}
              </span>
            ))}
          </div>
          <p className={styles.overviewSubtle}>
            Your Cornell notes, flashcards, practice quiz, and memory tips emphasize these
            topics.
          </p>
        </div>
      ) : (
        <p className={styles.encourage}>
          You&apos;re strong across the board. Your study plan covers all topics evenly to keep
          you sharp.
        </p>
      )}

      <div className={styles.topicList}>
        {results.map((result) => {
          const isWeak = result.correct / result.total < 0.7;
          return (
            <div key={result.topic} className={styles.topicRow}>
              <span className={styles.topicName}>{result.topic}</span>
              <span className={isWeak ? styles.topicScoreWeak : styles.topicScoreStrong}>
                {result.correct}/{result.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className={styles.card}>
      <div className={styles.loadingRow}>
        <span className={styles.loadingSpinner} />
        <span>{label}</span>
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.card}>
      <p className={styles.errorText}>{message}</p>
      <button type="button" onClick={onRetry} className={styles.retryButton}>
        Try again
      </button>
    </div>
  );
}
