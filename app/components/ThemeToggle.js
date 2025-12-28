"use client";

import { useTheme } from "@/app/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme, themes } = useTheme();

  const getIcon = () => {
    if (theme === themes.SYSTEM) {
      return "💻";
    } else if (resolvedTheme === themes.DARK) {
      return "🌙";
    } else {
      return "☀️";
    }
  };

  const getLabel = () => {
    if (theme === themes.SYSTEM) {
      return "System";
    } else if (theme === themes.DARK) {
      return "Dark";
    } else {
      return "Light";
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all font-semibold flex items-center gap-2"
      title={`Theme: ${getLabel()} (click to cycle)`}
    >
      <span className="text-lg transition-transform duration-300 hover:scale-110">
        {getIcon()}
      </span>
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  );
}
