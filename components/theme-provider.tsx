"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserSettings } from "@/lib/domain";
import { localStudyRepository } from "@/lib/storage-local";
import { THEMES } from "@/lib/themes";
import { PointsToast } from "@/components/ui/points-toast";

interface ThemeContextValue {
  settings: UserSettings;
  switchTheme: (themeId: string) => Promise<void>;
  purchaseTheme: (themeId: string) => Promise<boolean>;
  toggleDarkMode: () => Promise<void>;
  toggleBackgroundMusic: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  addPoints: (amount: number) => Promise<void>;
  isLoaded: boolean;
}

const defaultSettings: UserSettings = {
  totalPoints: 0,
  activeThemeId: "original",
  purchasedThemeIds: ["original"],
  darkModeEnabled: false,
  backgroundMusicEnabled: true,
  displayName: "",
};

const ThemeContext = createContext<ThemeContextValue>({
  settings: defaultSettings,
  switchTheme: async () => {},
  purchaseTheme: async () => false,
  toggleDarkMode: async () => {},
  toggleBackgroundMusic: async () => {},
  updateDisplayName: async () => {},
  addPoints: async () => {},
  isLoaded: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toastAmount, setToastAmount] = useState<number | null>(null);

  useEffect(() => {
    localStudyRepository.getUserSettings().then((s) => {
      setSettings(s);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const html = document.documentElement;
    html.setAttribute("data-theme", settings.activeThemeId);
    if (settings.darkModeEnabled) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [settings.activeThemeId, settings.darkModeEnabled, isLoaded]);

  const persistSettings = useCallback(
    async (next: UserSettings) => {
      setSettings(next);
      await localStudyRepository.saveStudyState({ userSettings: next });
    },
    []
  );

  const switchTheme = useCallback(
    async (themeId: string) => {
      if (!settings.purchasedThemeIds.includes(themeId)) return;
      await persistSettings({ ...settings, activeThemeId: themeId });
    },
    [settings, persistSettings]
  );

  const purchaseTheme = useCallback(
    async (themeId: string): Promise<boolean> => {
      const theme = THEMES.find((t) => t.id === themeId);
      if (!theme) return false;
      if (settings.purchasedThemeIds.includes(themeId)) return false;
      if (settings.totalPoints < theme.cost) return false;
      await persistSettings({
        ...settings,
        totalPoints: settings.totalPoints - theme.cost,
        purchasedThemeIds: [...settings.purchasedThemeIds, themeId],
      });
      return true;
    },
    [settings, persistSettings]
  );

  const toggleDarkMode = useCallback(async () => {
    await persistSettings({
      ...settings,
      darkModeEnabled: !settings.darkModeEnabled,
    });
  }, [settings, persistSettings]);

  const toggleBackgroundMusic = useCallback(async () => {
    await persistSettings({
      ...settings,
      backgroundMusicEnabled: !settings.backgroundMusicEnabled,
    });
  }, [settings, persistSettings]);

  const updateDisplayName = useCallback(
    async (name: string) => {
      await persistSettings({ ...settings, displayName: name });
    },
    [settings, persistSettings]
  );

  const addPoints = useCallback(
    async (amount: number) => {
      await persistSettings({
        ...settings,
        totalPoints: settings.totalPoints + amount,
      });
      setToastAmount(amount);
    },
    [settings, persistSettings]
  );

  return (
    <ThemeContext.Provider
      value={{
        settings,
        switchTheme,
        purchaseTheme,
        toggleDarkMode,
        toggleBackgroundMusic,
        updateDisplayName,
        addPoints,
        isLoaded,
      }}
    >
      {children}
      {toastAmount !== null && (
        <PointsToast amount={toastAmount} onDone={() => setToastAmount(null)} />
      )}
    </ThemeContext.Provider>
  );
}
