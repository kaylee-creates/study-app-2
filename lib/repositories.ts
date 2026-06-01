import type {
  StudyState,
  StudyTrack,
  Note,
  Flashcard,
  PomodoroSession,
  PlanItem,
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
  getPomodoroSettings(): Promise<PomodoroSettings>;
  getStudyGuides(): Promise<StudyGuide[]>;
  getUserSettings(): Promise<UserSettings>;
}
