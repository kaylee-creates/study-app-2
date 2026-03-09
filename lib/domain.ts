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

export interface ScrapbookItem {
  id: string;
  pageId: string;
  type: "image" | "widget";
  imageUrl?: string;
  imageName?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation?: number;
  relatedEntityId?: string;
  createdAt: string;
}

export type StudyGuideFormat = "tree" | "cornell" | "mapping";

export interface StudyGuide {
  id: string;
  title: string;
  format: StudyGuideFormat;
  content: string;
  rawSource: string;
  createdAt: string;
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
  scrapbookItems: ScrapbookItem[];
  pomodoroSettings: PomodoroSettings;
  studyGuides: StudyGuide[];
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
