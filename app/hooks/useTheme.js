"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "furnacescout_theme";
const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

export function useTheme() {
  const [theme, setTheme] = useState(THEMES.SYSTEM);
  const [resolvedTheme, setResolvedTheme] = useState(THEMES.LIGHT);

  useEffect(() => {
    // Load theme from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && Object.values(THEMES).includes(stored)) {
      setTheme(stored);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === THEMES.SYSTEM) {
        applyTheme(THEMES.SYSTEM);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function applyTheme(newTheme) {
    const root = document.documentElement;
    let effectiveTheme;

    if (newTheme === THEMES.SYSTEM) {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      effectiveTheme = systemPrefersDark ? THEMES.DARK : THEMES.LIGHT;
    } else {
      effectiveTheme = newTheme;
    }

    // Update DOM
    if (effectiveTheme === THEMES.DARK) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    setResolvedTheme(effectiveTheme);
  }

  function changeTheme(newTheme) {
    setTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }

  function toggleTheme() {
    if (theme === THEMES.SYSTEM) {
      // System -> Light
      changeTheme(THEMES.LIGHT);
    } else if (theme === THEMES.LIGHT) {
      // Light -> Dark
      changeTheme(THEMES.DARK);
    } else {
      // Dark -> System
      changeTheme(THEMES.SYSTEM);
    }
  }

  return {
    theme, // Current theme setting (light/dark/system)
    resolvedTheme, // Actual applied theme (light/dark)
    setTheme: changeTheme,
    toggleTheme,
    themes: THEMES,
  };
}
