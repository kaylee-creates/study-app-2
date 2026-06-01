export interface StudyTrack {
  id: string;
  name: string;
  description: string;
  targetMinutesPerDay: number;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroSession {
  id: string;
  trackId: string | null;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  isCompleted: boolean;
  pointsEarned: number;
  label: string;
}

export type NoteSource = "manual" | "import";

export interface Note {
  id: string;
  trackId: string | null;
  title: string;
  rawContent: string;
  createdAt: string;
  updatedAt: string;
  source: NoteSource;
}

export interface Flashcard {
  id: string;
  noteId: string | null;
  trackId: string | null;
  question: string;
  answer: string;
  createdAt: string;
  lastReviewedAt: string | null;
  easeScore: number;
}

export type PlanItemStatus = "pending" | "done" | "skipped";

export interface PlanItem {
  id: string;
  trackId: string | null;
  title: string;
  scheduledFor: string;
  status: PlanItemStatus;
  startTime?: string;
  endTime?: string;
  description?: string;
  isAllDay?: boolean;
  color?: string;
}

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pointsPerFocusMinute: number;
}

export type StudyGuideFormat = "tree" | "cornell" | "questions";

export interface StudyGuideAnnotation {
  id: string;
  term: string;
  note: string;
  createdAt: string;
}

export type HighlightColor = "pink" | "orange" | "yellow" | "green" | "blue" | "purple";

export interface NotepadEntry {
  id: string;
  guideId: string;
  guideTitle: string;
  text: string;
  color: HighlightColor;
  note: string;
  createdAt: string;
}

export interface DiagnosticQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  topic: string;
}

export interface TopicResult {
  topic: string;
  correct: number;
  total: number;
}

export type MemoryTechnique = "acronym" | "rhyme" | "mnemonic" | "chunking";

export interface MemoryTip {
  topic: string;
  technique: MemoryTechnique;
  tip: string;
}

export interface DiagnosticPlan {
  questions: DiagnosticQuestion[];
  results: TopicResult[];
  weakTopics: string[];
}

export interface StudyGuide {
  id: string;
  title: string;
  format: StudyGuideFormat;
  content: string;
  rawSource: string;
  createdAt: string;
  annotations?: StudyGuideAnnotation[];
  diagnostic?: DiagnosticPlan;
}

export interface UserSettings {
  totalPoints: number;
  activeThemeId: string;
  purchasedThemeIds: string[];
  darkModeEnabled: boolean;
  backgroundMusicEnabled: boolean;
  displayName: string;
}

export interface StudyState {
  tracks: StudyTrack[];
  notes: Note[];
  flashcards: Flashcard[];
  pomodoroSessions: PomodoroSession[];
  planItems: PlanItem[];
  pomodoroSettings: PomodoroSettings;
  studyGuides: StudyGuide[];
  notepadEntries: NotepadEntry[];
  userSettings: UserSettings;
}

export interface AiSummaryInput {
  content: string;
  lengthPreference: "short" | "medium" | "long";
}

export interface AiSummaryResult {
  summary: string;
}

export interface AiFlashcardSuggestion {
  question: string;
  answer: string;
}
