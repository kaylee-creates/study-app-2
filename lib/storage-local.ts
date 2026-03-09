import type {
  StudyState,
  PomodoroSettings,
  ScrapbookItem,
  UserSettings,
} from "./domain";
import type { StudyRepository } from "./repositories";

const STORAGE_KEY = "kaylee-study-app-v1";

const defaultSettings: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pointsPerFocusMinute: 2,
};

const defaultUserSettings: UserSettings = {
  totalPoints: 0,
  activeThemeId: "original",
  purchasedThemeIds: ["original"],
  darkModeEnabled: false,
  backgroundMusicEnabled: true,
  displayName: "",
};

function getStoredState(): StudyState {
  if (typeof window === "undefined") {
    return getDefaultState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as Partial<StudyState>;
    return mergeWithDefaults(parsed);
  } catch {
    return getDefaultState();
  }
}

function getDefaultState(): StudyState {
  return {
    tracks: [],
    notes: [],
    flashcards: [],
    pomodoroSessions: [],
    planItems: [],
    scrapbookItems: [],
    pomodoroSettings: defaultSettings,
    studyGuides: [],
    userSettings: defaultUserSettings,
  };
}

function mergeWithDefaults(partial: Partial<StudyState>): StudyState {
  return {
    tracks: partial.tracks ?? [],
    notes: partial.notes ?? [],
    flashcards: partial.flashcards ?? [],
    pomodoroSessions: partial.pomodoroSessions ?? [],
    planItems: partial.planItems ?? [],
    scrapbookItems: partial.scrapbookItems ?? [],
    pomodoroSettings: partial.pomodoroSettings ?? defaultSettings,
    studyGuides: partial.studyGuides ?? [],
    userSettings: {
      ...defaultUserSettings,
      ...(partial.userSettings ?? {}),
    },
  };
}

function persist(state: StudyState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export const localStudyRepository: StudyRepository = {
  async loadStudyState() {
    return getStoredState();
  },

  async saveStudyState(partial: Partial<StudyState>) {
    const current = getStoredState();
    const next: StudyState = {
      tracks: partial.tracks ?? current.tracks,
      notes: partial.notes ?? current.notes,
      flashcards: partial.flashcards ?? current.flashcards,
      pomodoroSessions: partial.pomodoroSessions ?? current.pomodoroSessions,
      planItems: partial.planItems ?? current.planItems,
      scrapbookItems: partial.scrapbookItems ?? current.scrapbookItems,
      pomodoroSettings: partial.pomodoroSettings ?? current.pomodoroSettings,
      studyGuides: partial.studyGuides ?? current.studyGuides,
      userSettings: partial.userSettings
        ? { ...current.userSettings, ...partial.userSettings }
        : current.userSettings,
    };
    persist(next);
  },

  async getTracks() {
    return getStoredState().tracks;
  },

  async getNotes() {
    return getStoredState().notes;
  },

  async getFlashcards() {
    return getStoredState().flashcards;
  },

  async getPomodoroSessions() {
    return getStoredState().pomodoroSessions;
  },

  async getPlanItems() {
    return getStoredState().planItems;
  },

  async getScrapbookItems(pageId: string) {
    const items = getStoredState().scrapbookItems;
    return items.filter((i) => i.pageId === pageId);
  },

  async getPomodoroSettings() {
    const s = getStoredState().pomodoroSettings;
    return { ...defaultSettings, ...s };
  },

  async getStudyGuides() {
    return getStoredState().studyGuides;
  },

  async getUserSettings() {
    return getStoredState().userSettings;
  },

  async saveScrapbookItems(pageId: string, items: ScrapbookItem[]) {
    const state = getStoredState();
    const otherItems = state.scrapbookItems.filter((i) => i.pageId !== pageId);
    persist({
      ...state,
      scrapbookItems: [...otherItems, ...items],
    });
  },
};
