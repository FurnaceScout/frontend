"use client";

import { useTheme as useNextTheme } from "next-themes";

const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

/**
 * Wrapper around next-themes useTheme hook
 * Provides consistent API for FurnaceScout theme management
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();

  return {
    theme: theme || THEMES.SYSTEM,
    resolvedTheme: resolvedTheme || THEMES.LIGHT,
    setTheme,
    systemTheme,
    themes: THEMES,
    // Legacy compatibility: toggleTheme cycles through light -> dark -> system
    toggleTheme: () => {
      if (theme === THEMES.LIGHT) {
        setTheme(THEMES.DARK);
      } else if (theme === THEMES.DARK) {
        setTheme(THEMES.SYSTEM);
      } else {
        setTheme(THEMES.LIGHT);
      }
    },
  };
}
