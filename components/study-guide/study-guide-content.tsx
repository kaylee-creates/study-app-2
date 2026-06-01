"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { localStudyRepository, generateId } from "@/lib/storage-local";
import { useTheme } from "@/components/theme-provider";
import { extractText } from "@/lib/extract-text";
import { CornellRenderer } from "@/components/study-guide/cornell-renderer";
import { TreeRenderer } from "@/components/study-guide/tree-renderer";
import { QuestionsRenderer } from "@/components/study-guide/questions-renderer";
import { DiagnosticQuiz } from "@/components/study-guide/diagnostic-quiz";
import { StudyPlan } from "@/components/study-guide/study-plan";
import type {
  AiFlashcardSuggestion,
  DiagnosticQuestion,
  HighlightColor,
  NotepadEntry,
  StudyGuide,
  TopicResult,
} from "@/lib/domain";

type StudyMode = "input" | "diagnostic" | "results";

const styles = {
  root: "space-y-6",
  titleBlock: "inline-block",
  title: "font-serif text-page-title text-theme-text",

  savedList: "space-y-2",
  savedListHeader: "flex items-center justify-between",
  savedRecentList: "flex flex-wrap gap-2",
  savedButton: "glass-card rounded-xl px-3 py-2 text-small whitespace-nowrap shrink-0 transition-colors",
  savedButtonActive: "border-theme-accent",
  savedButtonIdle: "hover:border-theme-accent/50",
  savedTitle: "font-medium text-theme-text",
  savedFormat: "ml-1 capitalize text-theme-text-muted",
  savedViewAllButton: "text-small text-theme-accent hover:underline",
  savedModalOverlay: "fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm",
  savedModalCard: "glass-card w-full max-w-lg rounded-2xl p-4 space-y-3 max-h-[80vh]",
  savedModalHeader: "flex items-center justify-between",
  savedModalTitle: "font-serif text-card-title text-theme-text",
  savedModalList: "space-y-2 overflow-y-auto pr-1",
  savedModalClose: "rounded-lg px-3 py-1 text-caption text-theme-text-muted hover:bg-theme-accent/10",
  notepadButton: "text-small text-theme-accent hover:underline",
  notepadModalCard: "glass-card w-full max-w-3xl rounded-2xl p-4 space-y-3 max-h-[85vh]",
  notepadToolbar: "flex flex-wrap items-center gap-2",
  notepadSelect:
    "rounded-lg border border-theme-accent/20 bg-theme-bg px-2 py-1 text-small text-theme-text focus:outline-none focus:border-theme-accent",
  notepadList: "space-y-2 overflow-y-auto pr-1",
  notepadItem: "rounded-xl border border-theme-accent/15 bg-theme-bg/60 p-3 space-y-2",
  notepadMeta: "text-caption text-theme-text-muted",
  notepadSnippet: "text-small font-medium text-theme-text",
  notepadTextarea:
    "w-full resize-y rounded-lg border border-theme-accent/20 bg-theme-bg px-3 py-2 text-small text-theme-text focus:outline-none focus:border-theme-accent",
  notepadActions: "flex items-center justify-end gap-3",
  notepadDelete: "text-caption text-red-500 hover:underline",

  inputSection: "space-y-4",
  loadingOverlay: "fixed inset-0 z-50 flex items-center justify-center bg-theme-bg/55 backdrop-blur-sm",
  loadingCard: "glass-card rounded-2xl px-6 py-5 text-center",
  loadingSpinner: "mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-theme-accent/30 border-t-theme-accent",
  loadingText: "font-serif text-body text-theme-text",

  uploadZone: "glass-card rounded-2xl p-8 text-center border-2 border-dashed border-theme-accent/30 hover:border-theme-accent/50 transition-colors",
  uploadHint: "mb-3 font-serif text-card-title text-theme-text-muted",
  uploadLabel: "inline-block glass rounded-xl px-5 py-2 shadow-glass text-body font-medium text-theme-text cursor-pointer hover:scale-[1.02] transition-transform",
  fileError: "mt-2 text-small text-red-500",

  textCard: "glass-card rounded-2xl p-4",
  textHint: "mb-2 text-small text-theme-text-muted",
  textarea: "w-full min-h-[200px] rounded-xl px-4 py-3 bg-theme-bg border border-theme-accent/20 text-body text-theme-text placeholder:text-theme-text-muted/50 focus:outline-none focus:border-theme-accent resize-y",

  generateButton: "w-full glass rounded-2xl px-6 py-3 shadow-glass font-serif text-card-title font-medium text-theme-text hover:scale-[1.01] transition-transform disabled:opacity-50",
  coinRow: "flex items-center justify-center gap-2 text-theme-text-muted",
  coinText: "text-small",

  resultSection: "space-y-4",
  resultTopRow: "flex flex-wrap items-center justify-between gap-2",
  backButton: "text-small text-theme-accent hover:underline",
  resultCard: "glass-card rounded-2xl p-6",
  proseWrapper: [
    "prose prose-sm max-w-none text-theme-text",
    "prose-headings:font-serif prose-headings:text-theme-text",
    "prose-p:text-theme-text prose-li:text-theme-text",
    "prose-strong:text-theme-text prose-a:text-theme-accent",
  ].join(" "),

  errorText: "text-small text-red-500",
};

const mdStyles = {
  h1: "mt-6 mb-3 text-section-title font-serif font-bold",
  h2: "mt-6 mb-2 text-card-title font-serif font-semibold",
  h3: "mt-4 mb-1 text-body font-serif font-semibold",
  li: "ml-4 list-disc text-small leading-relaxed",
  p: "text-small leading-relaxed",
};

const notepadMarkClassByColor: Record<HighlightColor, string> = {
  pink: "bg-pink-300/60",
  orange: "bg-orange-300/60",
  yellow: "bg-yellow-300/60",
  green: "bg-green-300/60",
  blue: "bg-blue-300/60",
  purple: "bg-purple-300/60",
};

export function StudyGuideContent() {
  const router = useRouter();
  const { addPoints } = useTheme();
  const [mode, setMode] = useState<StudyMode>("input");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState("");
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<DiagnosticQuestion[]>([]);
  const [diagnosticResults, setDiagnosticResults] = useState<TopicResult[]>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [savedGuides, setSavedGuides] = useState<StudyGuide[]>([]);
  const [notepadEntries, setNotepadEntries] = useState<NotepadEntry[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<StudyGuide | null>(null);
  const [showGuidePicker, setShowGuidePicker] = useState(false);
  const [showNotepad, setShowNotepad] = useState(false);
  const [notepadColorFilter, setNotepadColorFilter] = useState<HighlightColor | "all">("all");
  const [fileError, setFileError] = useState("");

  const recentGuides = useMemo(() => [...savedGuides].slice(-2).reverse(), [savedGuides]);

  useEffect(() => {
    localStudyRepository.loadStudyState().then((state) => {
      setSavedGuides(state.studyGuides);
      setNotepadEntries(state.notepadEntries ?? []);
    });
  }, []);

  const processFile = useCallback(async (file: File) => {
    setFileError("");
    try {
      const text = await extractText(file);
      setInputText(text);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Failed to read file.");
    }
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      processFile(file);
    },
    [processFile]
  );

  const startDiagnostic = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setDiagnosticError("");
    try {
      const res = await fetch("/api/ai/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputText }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        setDiagnosticError("Could not build a quiz from these notes. Please try again.");
        return;
      }
      setDiagnosticQuestions(data.questions);
      setMode("diagnostic");
    } catch {
      setDiagnosticError("Failed to build a quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = async (results: TopicResult[], weak: string[]) => {
    setDiagnosticResults(results);
    setWeakTopics(weak);

    const guide: StudyGuide = {
      id: generateId(),
      title: inputText.slice(0, 50).trim() + (inputText.length > 50 ? "..." : ""),
      format: "cornell",
      content: "",
      rawSource: inputText,
      createdAt: new Date().toISOString(),
      diagnostic: { questions: diagnosticQuestions, results, weakTopics: weak },
    };
    const state = await localStudyRepository.loadStudyState();
    await localStudyRepository.saveStudyState({
      studyGuides: [...state.studyGuides, guide],
    });
    setSavedGuides((prev) => [...prev, guide]);
    setSelectedGuide(guide);
    setMode("results");
    await addPoints(15);
  };

  const saveFlashcards = useCallback(
    async (cards: AiFlashcardSuggestion[]) => {
      const state = await localStudyRepository.loadStudyState();
      const newCards = cards.map((card) => ({
        id: generateId(),
        noteId: null,
        trackId: null,
        question: card.question,
        answer: card.answer,
        createdAt: new Date().toISOString(),
        lastReviewedAt: null,
        easeScore: 1,
      }));
      await localStudyRepository.saveStudyState({
        flashcards: [...state.flashcards, ...newCards],
      });
      router.push("/flashcards");
    },
    [router]
  );

  const viewGuide = (guide: StudyGuide) => {
    setSelectedGuide(guide);
    setShowGuidePicker(false);
    if (guide.diagnostic) {
      setInputText(guide.rawSource);
      setDiagnosticQuestions(guide.diagnostic.questions);
      setDiagnosticResults(guide.diagnostic.results);
      setWeakTopics(guide.diagnostic.weakTopics);
      setMode("results");
    } else {
      setMode("results");
    }
  };

  const backToInput = () => {
    setMode("input");
    setSelectedGuide(null);
    setDiagnosticQuestions([]);
    setDiagnosticResults([]);
    setWeakTopics([]);
    setDiagnosticError("");
  };

  const updateSelectedGuide = useCallback(
    async (updater: (guide: StudyGuide) => StudyGuide) => {
      if (!selectedGuide) return;
      const state = await localStudyRepository.loadStudyState();
      const updatedGuides = state.studyGuides.map((guide) =>
        guide.id === selectedGuide.id ? updater(guide) : guide
      );
      await localStudyRepository.saveStudyState({ studyGuides: updatedGuides });
      setSavedGuides(updatedGuides);
      const updatedSelected = updatedGuides.find((guide) => guide.id === selectedGuide.id) ?? null;
      setSelectedGuide(updatedSelected);
    },
    [selectedGuide]
  );

  const createNotepadEntry = useCallback(
    async (text: string, color: HighlightColor, note: string) => {
      if (!selectedGuide) return;
      const cleaned = text.trim().replace(/\s+/g, " ");
      if (!cleaned) return;
      const state = await localStudyRepository.loadStudyState();
      const nextEntry: NotepadEntry = {
        id: generateId(),
        guideId: selectedGuide.id,
        guideTitle: selectedGuide.title,
        text: cleaned,
        color,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = [nextEntry, ...(state.notepadEntries ?? [])];
      await localStudyRepository.saveStudyState({ notepadEntries: updated });
      setNotepadEntries(updated);
    },
    [selectedGuide]
  );

  const updateNotepadEntry = useCallback(async (id: string, note: string) => {
    const state = await localStudyRepository.loadStudyState();
    const updated = (state.notepadEntries ?? []).map((entry) =>
      entry.id === id ? { ...entry, note } : entry
    );
    await localStudyRepository.saveStudyState({ notepadEntries: updated });
    setNotepadEntries(updated);
  }, []);

  const deleteNotepadEntry = useCallback(async (id: string) => {
    const state = await localStudyRepository.loadStudyState();
    const updated = (state.notepadEntries ?? []).filter((entry) => entry.id !== id);
    await localStudyRepository.saveStudyState({ notepadEntries: updated });
    setNotepadEntries(updated);
  }, []);

  const filteredNotepadEntries = useMemo(() => {
    const ordered = [...notepadEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (notepadColorFilter === "all") return ordered;
    return ordered.filter((entry) => entry.color === notepadColorFilter);
  }, [notepadColorFilter, notepadEntries]);

  return (
    <div className={styles.root}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Building your diagnostic quiz...</p>
          </div>
        </div>
      )}

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Study Guide</h1>
      </div>

      {savedGuides.length > 0 && (
        <div className={styles.savedList}>
          <div className={styles.savedListHeader}>
            <p className={styles.textHint}>Recent guides</p>
            {savedGuides.length > 2 && (
              <button
                type="button"
                className={styles.savedViewAllButton}
                onClick={() => setShowGuidePicker(true)}
              >
                View all
              </button>
            )}
          </div>
          <div className={styles.savedRecentList}>
            {recentGuides.map((g) => (
              <button
                key={g.id}
                onClick={() => viewGuide(g)}
                className={`${styles.savedButton} ${
                  selectedGuide?.id === g.id
                    ? styles.savedButtonActive
                    : styles.savedButtonIdle
                }`}
              >
                <span className={styles.savedTitle}>{g.title}</span>
                <span className={styles.savedFormat}>({g.format})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showGuidePicker && (
        <div className={styles.savedModalOverlay} role="dialog" aria-modal="true">
          <div className={styles.savedModalCard}>
            <div className={styles.savedModalHeader}>
              <h2 className={styles.savedModalTitle}>All saved guides</h2>
              <button
                type="button"
                className={styles.savedModalClose}
                onClick={() => setShowGuidePicker(false)}
              >
                Close
              </button>
            </div>
            <div className={styles.savedModalList}>
              {[...savedGuides].reverse().map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => viewGuide(guide)}
                  className={`${styles.savedButton} w-full text-left ${
                    selectedGuide?.id === guide.id
                      ? styles.savedButtonActive
                      : styles.savedButtonIdle
                  }`}
                >
                  <span className={styles.savedTitle}>{guide.title}</span>
                  <span className={styles.savedFormat}>({guide.format})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "input" && (
        <div className={styles.inputSection}>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={styles.uploadZone}
          >
            <p className={styles.uploadHint}>
              Drag & drop a text file, PDF, or DOCX to upload
            </p>
            <label className={styles.uploadLabel}>
              Upload File
              <input
                type="file"
                accept=".txt,.md,.pdf,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {fileError && <p className={styles.fileError}>{fileError}</p>}
          </div>

          <div className={styles.textCard}>
            <p className={styles.textHint}>Or paste/write your notes:</p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={styles.textarea}
              placeholder="Paste your study material here..."
            />
          </div>

          <button
            onClick={startDiagnostic}
            disabled={loading || !inputText.trim()}
            className={styles.generateButton}
          >
            {loading ? "Building quiz..." : "Start Diagnostic Quiz"}
          </button>

          {diagnosticError && <p className={styles.errorText}>{diagnosticError}</p>}

          <div className={styles.coinRow}>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="var(--color-accent-yellow)" opacity="0.6" />
              <text x="10" y="14" textAnchor="middle" fontSize="10" fill="var(--color-text)" fontWeight="bold">$</text>
            </svg>
            <span className={styles.coinText}>Earn 15 coins for each study plan you complete</span>
          </div>
        </div>
      )}

      {mode === "diagnostic" && (
        <div className={styles.resultSection}>
          <div className={styles.resultTopRow}>
            <button onClick={backToInput} className={styles.backButton}>
              &larr; Back to input
            </button>
          </div>
          <p className={styles.textHint}>
            Answer these questions so we can find what to focus on, then build your plan.
          </p>
          <DiagnosticQuiz questions={diagnosticQuestions} onComplete={handleQuizComplete} />
        </div>
      )}

      {mode === "results" && (
        <div className={styles.resultSection}>
          <div className={styles.resultTopRow}>
            <button onClick={backToInput} className={styles.backButton}>
              &larr; Back to input
            </button>
            <button type="button" className={styles.notepadButton} onClick={() => setShowNotepad(true)}>
              Open Notepad
            </button>
          </div>

          {selectedGuide?.diagnostic || diagnosticResults.length > 0 ? (
            <StudyPlan
              guideId={selectedGuide?.id}
              title={selectedGuide?.title ?? inputText.slice(0, 50).trim()}
              date={selectedGuide?.createdAt ?? new Date().toISOString()}
              rawSource={selectedGuide?.rawSource ?? inputText}
              results={diagnosticResults}
              weakTopics={weakTopics}
              notepadEntries={notepadEntries}
              cornellContent={selectedGuide?.content || undefined}
              onCornellContentChange={(content) => {
                if (selectedGuide) {
                  void updateSelectedGuide((guide) => ({ ...guide, content }));
                }
              }}
              onCreateNotepadEntry={createNotepadEntry}
              onSaveFlashcards={saveFlashcards}
            />
          ) : (
            <LegacyGuideView guide={selectedGuide} />
          )}
        </div>
      )}

      {showNotepad && (
        <div className={styles.savedModalOverlay} role="dialog" aria-modal="true">
          <div className={styles.notepadModalCard}>
            <div className={styles.savedModalHeader}>
              <h2 className={styles.savedModalTitle}>Saved highlights</h2>
              <button
                type="button"
                className={styles.savedModalClose}
                onClick={() => setShowNotepad(false)}
              >
                Close
              </button>
            </div>
            <div className={styles.notepadToolbar}>
              <label className={styles.textHint}>
                Filter color:
                <select
                  className={styles.notepadSelect}
                  value={notepadColorFilter}
                  onChange={(e) =>
                    setNotepadColorFilter(e.target.value as HighlightColor | "all")
                  }
                >
                  <option value="all">All</option>
                  <option value="pink">Pink</option>
                  <option value="orange">Orange</option>
                  <option value="yellow">Yellow</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                </select>
              </label>
            </div>
            <div className={styles.notepadList}>
              {filteredNotepadEntries.length === 0 ? (
                <p className={styles.textHint}>No saved highlights yet.</p>
              ) : (
                filteredNotepadEntries.map((entry) => (
                  <NotepadEntryCard
                    key={entry.id}
                    entry={entry}
                    onSave={updateNotepadEntry}
                    onDelete={deleteNotepadEntry}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotepadEntryCard({
  entry,
  onSave,
  onDelete,
}: {
  entry: NotepadEntry;
  onSave: (id: string, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(entry.note);

  useEffect(() => {
    setDraft(entry.note);
  }, [entry.id, entry.note]);

  return (
    <div className={styles.notepadItem}>
      <p className={styles.notepadSnippet}>
        <mark className={`rounded px-1 ${notepadMarkClassByColor[entry.color]}`}>{entry.text}</mark>
      </p>
      <p className={styles.notepadMeta}>
        {entry.guideTitle} • {new Date(entry.createdAt).toLocaleString()}
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onSave(entry.id, draft.trim())}
        rows={2}
        placeholder="Add note..."
        className={styles.notepadTextarea}
      />
      <div className={styles.notepadActions}>
        <button
          type="button"
          className={styles.notepadDelete}
          onClick={() => void onDelete(entry.id)}
        >
          Delete note
        </button>
      </div>
    </div>
  );
}

function LegacyGuideView({ guide }: { guide: StudyGuide | null }) {
  if (!guide) return null;
  if (guide.format === "cornell") {
    return (
      <CornellRenderer
        guideId={guide.id}
        guideTitle={guide.title}
        title={guide.title}
        date={guide.createdAt}
        content={guide.content}
        notepadEntries={[]}
        onSave={() => {}}
      />
    );
  }
  if (guide.format === "questions") {
    return <QuestionsRenderer content={guide.content} />;
  }
  if (guide.format === "tree") {
    return (
      <div className={styles.resultCard}>
        <TreeRenderer content={guide.content} />
      </div>
    );
  }
  return (
    <div className={styles.resultCard}>
      <div className={styles.proseWrapper}>
        <MarkdownRenderer content={guide.content} />
      </div>
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
        <h3 key={i} className={mdStyles.h3}>{trimmed.slice(4)}</h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={i} className={mdStyles.h2}>{trimmed.slice(3)}</h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={i} className={mdStyles.h1}>{trimmed.slice(2)}</h1>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <li key={i} className={mdStyles.li}>{trimmed.slice(2)}</li>
      );
    } else if (trimmed === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(
        <p key={i} className={mdStyles.p}>{trimmed}</p>
      );
    }
  });

  return <>{elements}</>;
}
