"use client";

import { useMemo, useState } from "react";

interface MultipleChoiceQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

const styles = {
  emptyCard: "glass-card rounded-2xl p-6",
  emptyMessage: "text-sm text-theme-text-muted",
  optionLabel: "mr-2 font-semibold text-theme-text-muted",
  optionButtonBase:
    "w-full rounded-xl border px-4 py-3 text-left text-sm text-theme-text transition-colors",
  optionIdle: "border-theme-accent/30 hover:border-theme-accent/60",
  optionCorrect: "border-emerald-500/70 bg-emerald-400/15",
  optionWrong: "border-rose-500/70 bg-rose-400/15",
  optionDimmed: "border-theme-accent/20 opacity-75",
  progressCard: "glass-card flex items-center justify-between rounded-2xl p-4",
  progressLabel: "text-xs uppercase tracking-wide text-theme-text-muted",
  progressReset: "mt-1 text-sm text-theme-accent hover:underline",
  progressRight: "text-right",
  progressScore: "font-serif text-lg text-theme-text",
  progressStats: "text-sm text-theme-text-muted",
  questionCard: "glass-card space-y-3 rounded-2xl p-5",
  questionTitle: "font-serif text-lg text-theme-text",
  explanation: "text-sm text-theme-text-muted",
  optionsList: "space-y-2",
  root: "space-y-4",
};

function parseQuestions(content: string): MultipleChoiceQuestion[] {
  const raw = content.trim();
  const withoutFence = raw.startsWith("```")
    ? raw.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "")
    : raw;
  const candidate = withoutFence.match(/\[[\s\S]*\]/)?.[0] ?? withoutFence;

  try {
    const parsed = JSON.parse(candidate);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item): MultipleChoiceQuestion | null => {
        if (!item || typeof item !== "object") return null;
        const question = typeof item.question === "string" ? item.question.trim() : "";
        const options = Array.isArray(item.options)
          ? item.options
              .filter((opt: unknown): opt is string => typeof opt === "string")
              .map((opt: string) => opt.trim())
          : [];
        const correctIndex =
          typeof item.correctIndex === "number" ? item.correctIndex : Number.NaN;
        const explanation =
          typeof item.explanation === "string" ? item.explanation.trim() : undefined;

        if (!question || options.length < 2 || !Number.isFinite(correctIndex)) {
          return null;
        }

        const boundedCorrect = Math.max(0, Math.min(options.length - 1, correctIndex));
        return {
          question,
          options,
          correctIndex: boundedCorrect,
          explanation,
        };
      })
      .filter((q): q is MultipleChoiceQuestion => q !== null);
  } catch {
    return [];
  }
}

function optionPrefix(index: number): string {
  return String.fromCharCode(65 + index);
}

export function QuestionsRenderer({ content }: { content: string }) {
  const questions = useMemo(() => parseQuestions(content), [content]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const answeredCount = Object.keys(selectedAnswers).length;
  const score = questions.reduce((total, q, i) => {
    return selectedAnswers[i] === q.correctIndex ? total + 1 : total;
  }, 0);

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => {
      if (prev[questionIndex] !== undefined) return prev;
      return { ...prev, [questionIndex]: optionIndex };
    });
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
  };

  if (questions.length === 0) {
    return (
      <div className={styles.emptyCard}>
        <p className={styles.emptyMessage}>
          Could not parse questions. Please regenerate the guide.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.progressCard}>
        <div>
          <p className={styles.progressLabel}>Quiz Progress</p>
          <p className={styles.progressScore}>
            Score: {score}/{questions.length}
          </p>
        </div>
        <div className={styles.progressRight}>
          <p className={styles.progressStats}>
            Answered: {answeredCount}/{questions.length}
          </p>
          <button
            onClick={resetQuiz}
            className={styles.progressReset}
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>

      {questions.map((q, questionIndex) => {
        const picked = selectedAnswers[questionIndex];
        const isAnswered = picked !== undefined;

        return (
          <div key={`${q.question}-${questionIndex}`} className={styles.questionCard}>
            <h3 className={styles.questionTitle}>
              {questionIndex + 1}. {q.question}
            </h3>
            <div className={styles.optionsList}>
              {q.options.map((option, optionIndex) => {
                const isPicked = picked === optionIndex;
                const isCorrect = optionIndex === q.correctIndex;

                const stateClass = !isAnswered
                  ? styles.optionIdle
                  : isCorrect
                    ? styles.optionCorrect
                    : isPicked
                      ? styles.optionWrong
                      : styles.optionDimmed;

                return (
                  <button
                    key={`${option}-${optionIndex}`}
                    type="button"
                    onClick={() => handleSelect(questionIndex, optionIndex)}
                    disabled={isAnswered}
                    className={`${styles.optionButtonBase} ${stateClass}`}
                  >
                    <span className={styles.optionLabel}>
                      {optionPrefix(optionIndex)}.
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <p className={styles.explanation}>
                {q.explanation
                  ? q.explanation
                  : picked === q.correctIndex
                    ? "Correct!"
                    : `Correct answer: ${optionPrefix(q.correctIndex)}. ${q.options[q.correctIndex]}`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
