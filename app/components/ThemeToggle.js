"use client";

import { useTheme } from "@/app/hooks/useTheme";
import { Button } from "@/app/components/ui/button";

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
    <Button
      onClick={toggleTheme}
      variant="secondary"
      className="gap-2"
      title={`Theme: ${getLabel()} (click to cycle)`}
    >
      <span className="text-lg transition-transform duration-300 hover:scale-110">
        {getIcon()}
      </span>
      <span className="hidden sm:inline">{getLabel()}</span>
    </Button>
  );
}
