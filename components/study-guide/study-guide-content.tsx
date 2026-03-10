"use client";

import { useCallback, useEffect, useState } from "react";
import { localStudyRepository, generateId } from "@/lib/storage-local";
import { useTheme } from "@/components/theme-provider";
import type { StudyGuide, StudyGuideFormat, AiFlashcardSuggestion } from "@/lib/domain";

const FORMAT_OPTIONS: { value: StudyGuideFormat; label: string; desc: string }[] = [
  { value: "tree", label: "Tree Model", desc: "Hierarchical topics & subtopics" },
  { value: "cornell", label: "Cornell Method", desc: "Cues, notes & summary" },
  { value: "mapping", label: "Concept Map", desc: "Central idea with branches" },
];

export function StudyGuideContent() {
  const { addPoints } = useTheme();
  const [mode, setMode] = useState<"input" | "result">("input");
  const [inputText, setInputText] = useState("");
  const [format, setFormat] = useState<StudyGuideFormat>("tree");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedGuides, setSavedGuides] = useState<StudyGuide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<StudyGuide | null>(null);
  const [flashcardsSuggested, setFlashcardsSuggested] = useState<AiFlashcardSuggestion[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);

  useEffect(() => {
    localStudyRepository.getStudyGuides().then(setSavedGuides);
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      setInputText(text);
      e.target.value = "";
    },
    []
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    file.text().then(setInputText);
  }, []);

  const generate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputText, format }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setResult(data.result);
        setMode("result");

        const guide: StudyGuide = {
          id: generateId(),
          title: inputText.slice(0, 50).trim() + (inputText.length > 50 ? "..." : ""),
          format,
          content: data.result,
          rawSource: inputText,
          createdAt: new Date().toISOString(),
        };
        const state = await localStudyRepository.loadStudyState();
        await localStudyRepository.saveStudyState({
          studyGuides: [...state.studyGuides, guide],
        });
        setSavedGuides((prev) => [...prev, guide]);
        await addPoints(15);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateFlashcards = async () => {
    const source = selectedGuide?.rawSource || inputText;
    if (!source.trim()) return;
    setFlashcardsLoading(true);
    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: source, count: 5 }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.cards)) {
        setFlashcardsSuggested(data.cards);
      }
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const addFlashcard = async (card: AiFlashcardSuggestion) => {
    const state = await localStudyRepository.loadStudyState();
    const newCard = {
      id: generateId(),
      noteId: null,
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
    setFlashcardsSuggested((prev) => prev.filter((c) => c !== card));
  };

  const viewGuide = (guide: StudyGuide) => {
    setSelectedGuide(guide);
    setResult(guide.content);
    setMode("result");
  };

  const backToInput = () => {
    setMode("input");
    setSelectedGuide(null);
    setResult("");
    setFlashcardsSuggested([]);
  };

  return (
    <div className="space-y-6">
      <div className="inline-block">
        <h1 className="font-serif text-3xl text-theme-text">Study Guide</h1>
        <svg className="mt-0.5" width="120" height="8" viewBox="0 0 120 8" fill="none">
          <path d="M2,4 C12,1 24,7 36,4 C48,1 60,7 72,4 C84,1 96,7 108,4 C112,3 116,4 118,4" stroke="var(--color-accent-yellow)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Saved guides list */}
      {savedGuides.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {savedGuides.map((g) => (
            <button
              key={g.id}
              onClick={() => viewGuide(g)}
              className={`glass-card rounded-xl px-3 py-2 text-sm whitespace-nowrap shrink-0 transition-colors ${
                selectedGuide?.id === g.id
                  ? "border-theme-accent"
                  : "hover:border-theme-accent/50"
              }`}
            >
              <span className="text-theme-text font-medium">{g.title}</span>
              <span className="text-theme-text-muted ml-1 capitalize">({g.format})</span>
            </button>
          ))}
        </div>
      )}

      {mode === "input" && (
        <div className="space-y-4">
          {/* Upload area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="glass-card rounded-2xl p-8 text-center border-2 border-dashed border-theme-accent/30 hover:border-theme-accent/50 transition-colors"
          >
            <p className="font-serif text-lg text-theme-text-muted mb-3">
              Drag & drop a text file or PDF to upload
            </p>
            <label className="inline-block glass rounded-xl px-5 py-2 shadow-glass text-base font-medium text-theme-text cursor-pointer hover:scale-[1.02] transition-transform">
              Upload File
              <input
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Manual text area */}
          <div className="glass-card rounded-2xl p-4">
            <p className="text-sm text-theme-text-muted mb-2">Or paste/write your notes:</p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full min-h-[200px] rounded-xl px-4 py-3 bg-theme-bg border border-theme-accent/20 text-theme-text text-base placeholder:text-theme-text-muted/50 focus:outline-none focus:border-theme-accent resize-y"
              placeholder="Paste your study material here..."
            />
          </div>

          {/* Format selector */}
          <div className="grid grid-cols-3 gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={`glass-card rounded-xl p-3 text-center transition-all ${
                  format === opt.value
                    ? "border-theme-accent ring-1 ring-theme-accent/30 scale-[1.02]"
                    : "hover:border-theme-accent/50"
                }`}
              >
                <span className="block font-serif text-base font-medium text-theme-text">
                  {opt.label}
                </span>
                <span className="block text-xs text-theme-text-muted mt-0.5">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !inputText.trim()}
            className="w-full glass rounded-2xl px-6 py-3 shadow-glass font-serif text-lg font-medium text-theme-text hover:scale-[1.01] transition-transform disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Study Guide"}
          </button>

          {/* Coin hint */}
          <div className="flex items-center justify-center gap-2 text-theme-text-muted">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="var(--color-accent-yellow)" opacity="0.6" />
              <text x="10" y="14" textAnchor="middle" fontSize="10" fill="var(--color-text)" fontWeight="bold">$</text>
            </svg>
            <span className="text-sm">Earn 15 coins for each study guide you create</span>
          </div>
        </div>
      )}

      {mode === "result" && (
        <div className="space-y-4">
          <button
            onClick={backToInput}
            className="text-sm text-theme-accent hover:underline"
          >
            &larr; Back to input
          </button>

          {/* Rendered result */}
          <div className="glass-card rounded-2xl p-6">
            <div
              className="prose prose-sm max-w-none text-theme-text
                prose-headings:font-serif prose-headings:text-theme-text
                prose-p:text-theme-text prose-li:text-theme-text
                prose-strong:text-theme-text prose-a:text-theme-accent"
            >
              <MarkdownRenderer content={result} />
            </div>
          </div>

          {/* Flashcard generation */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <button
              onClick={generateFlashcards}
              disabled={flashcardsLoading}
              className="glass rounded-xl px-4 py-2 shadow-glass text-sm font-medium text-theme-text hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {flashcardsLoading ? "Generating..." : "Generate Flashcards"}
            </button>
            {flashcardsSuggested.length > 0 && (
              <ul className="space-y-2">
                {flashcardsSuggested.map((c, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-theme-text">Q: {c.question}</span>
                    <button
                      onClick={() => addFlashcard(c)}
                      className="shrink-0 px-2 py-1 rounded-lg bg-theme-accent/10 text-theme-accent text-xs font-medium hover:bg-theme-accent/20"
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-serif font-semibold mt-4 mb-1">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-serif font-semibold mt-6 mb-2">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xl font-serif font-bold mt-6 mb-3">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-sm leading-relaxed">
          {trimmed.slice(2)}
        </li>
      );
    } else if (trimmed === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed">
          {trimmed}
        </p>
      );
    }
  });

  return <>{elements}</>;
}
