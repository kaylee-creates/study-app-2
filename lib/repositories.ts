import type {
  StudyState,
  StudyTrack,
  Note,
  Flashcard,
  PomodoroSession,
  PlanItem,
  ScrapbookItem,
  PomodoroSettings,
  StudyGuide,
  UserSettings,
} from "./domain";

export interface StudyRepository {
  loadStudyState(): Promise<StudyState>;
  saveStudyState(partial: Partial<StudyState>): Promise<void>;
  getTracks(): Promise<StudyTrack[]>;
  getNotes(): Promise<Note[]>;
  getFlashcards(): Promise<Flashcard[]>;
  getPomodoroSessions(): Promise<PomodoroSession[]>;
  getPlanItems(): Promise<PlanItem[]>;
  getScrapbookItems(pageId: string): Promise<ScrapbookItem[]>;
  getPomodoroSettings(): Promise<PomodoroSettings>;
  getStudyGuides(): Promise<StudyGuide[]>;
  getUserSettings(): Promise<UserSettings>;
  saveScrapbookItems(pageId: string, items: ScrapbookItem[]): Promise<void>;
}
