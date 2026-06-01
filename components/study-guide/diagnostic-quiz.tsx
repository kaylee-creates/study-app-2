"use client";

import { useMemo, useState } from "react";
import type { DiagnosticQuestion, TopicResult } from "@/lib/domain";

const WEAK_TOPIC_ACCURACY_THRESHOLD = 0.7;

const styles = {
  root: "space-y-4",
  progressCard: "glass-card flex items-center justify-between rounded-2xl p-4",
  progressLabel: "text-xs uppercase tracking-wide text-theme-text-muted",
  progressScore: "font-serif text-lg text-theme-text",
  progressRight: "text-right",
  progressStats: "text-sm text-theme-text-muted",
  questionCard: "glass-card space-y-3 rounded-2xl p-5",
  questionTopic:
    "inline-block rounded-full bg-theme-accent/10 px-2 py-0.5 text-caption font-medium text-theme-accent",
  questionTitle: "font-serif text-lg text-theme-text",
  optionsList: "space-y-2",
  optionLabel: "mr-2 font-semibold text-theme-text-muted",
  optionButtonBase:
    "w-full rounded-xl border px-4 py-3 text-left text-sm text-theme-text transition-colors",
  optionIdle: "border-theme-accent/30 hover:border-theme-accent/60",
  optionCorrect: "border-emerald-500/70 bg-emerald-400/15",
  optionWrong: "border-rose-500/70 bg-rose-400/15",
  optionDimmed: "border-theme-accent/20 opacity-75",
  explanation: "text-sm text-theme-text-muted",
  completeButton:
    "w-full glass rounded-2xl px-6 py-3 shadow-glass font-serif text-card-title font-medium text-theme-text hover:scale-[1.01] transition-transform disabled:opacity-50",
};

function optionPrefix(index: number): string {
  return String.fromCharCode(65 + index);
}

function computeTopicResults(
  questions: DiagnosticQuestion[],
  selectedAnswers: Record<number, number>
): TopicResult[] {
  const topicToResult = new Map<string, TopicResult>();
  questions.forEach((question, index) => {
    const existing = topicToResult.get(question.topic) ?? {
      topic: question.topic,
      correct: 0,
      total: 0,
    };
    existing.total += 1;
    if (selectedAnswers[index] === question.correctIndex) {
      existing.correct += 1;
    }
    topicToResult.set(question.topic, existing);
  });
  return Array.from(topicToResult.values());
}

function deriveWeakTopics(results: TopicResult[]): string[] {
  return results
    .filter((result) => result.correct / result.total < WEAK_TOPIC_ACCURACY_THRESHOLD)
    .map((result) => result.topic);
}

interface DiagnosticQuizProps {
  questions: DiagnosticQuestion[];
  onComplete: (results: TopicResult[], weakTopics: string[]) => void;
}

export function DiagnosticQuiz({ questions, onComplete }: DiagnosticQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === questions.length;
  const score = useMemo(
    () =>
      questions.reduce(
        (total, question, index) =>
          selectedAnswers[index] === question.correctIndex ? total + 1 : total,
        0
      ),
    [questions, selectedAnswers]
  );

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => {
      if (prev[questionIndex] !== undefined) return prev;
      return { ...prev, [questionIndex]: optionIndex };
    });
  };

  const handleComplete = () => {
    const results = computeTopicResults(questions, selectedAnswers);
    onComplete(results, deriveWeakTopics(results));
  };

  return (
    <div className={styles.root}>
      <div className={styles.progressCard}>
        <div>
          <p className={styles.progressLabel}>Diagnostic Quiz</p>
          <p className={styles.progressScore}>
            Score: {score}/{questions.length}
          </p>
        </div>
        <div className={styles.progressRight}>
          <p className={styles.progressStats}>
            Answered: {answeredCount}/{questions.length}
          </p>
        </div>
      </div>

      {questions.map((question, questionIndex) => {
        const picked = selectedAnswers[questionIndex];
        const isAnswered = picked !== undefined;

        return (
          <div key={`${question.question}-${questionIndex}`} className={styles.questionCard}>
            <span className={styles.questionTopic}>{question.topic}</span>
            <h3 className={styles.questionTitle}>
              {questionIndex + 1}. {question.question}
            </h3>
            <div className={styles.optionsList}>
              {question.options.map((option, optionIndex) => {
                const isPicked = picked === optionIndex;
                const isCorrect = optionIndex === question.correctIndex;

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
                    <span className={styles.optionLabel}>{optionPrefix(optionIndex)}.</span>
                    {option}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <p className={styles.explanation}>
                {question.explanation
                  ? question.explanation
                  : picked === question.correctIndex
                    ? "Correct!"
                    : `Correct answer: ${optionPrefix(question.correctIndex)}. ${
                        question.options[question.correctIndex]
                      }`}
              </p>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleComplete}
        disabled={!allAnswered}
        className={styles.completeButton}
      >
        {allAnswered
          ? "See my study plan"
          : `Answer all questions (${answeredCount}/${questions.length})`}
      </button>
    </div>
  );
}
