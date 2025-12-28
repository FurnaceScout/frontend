"use client";

import { useTheme } from "@/app/hooks/useTheme";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Card, CardContent } from "@/app/components/ui/card";

export default function ThemeToggle({ isOpen, onClose }) {
  const { theme, resolvedTheme, setTheme, themes } = useTheme();

  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme);
    onClose();
  };

  const themeOptions = [
    {
      value: themes.LIGHT,
      icon: "☀️",
      label: "Light",
      description: "Light theme with bright colors",
    },
    {
      value: themes.DARK,
      icon: "🌙",
      label: "Dark",
      description: "Dark theme for low-light environments",
    },
    {
      value: themes.SYSTEM,
      icon: "💻",
      label: "System",
      description: "Match your system preferences",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Theme</DialogTitle>
          <DialogDescription>
            Select your preferred color theme. System theme will automatically
            match your device settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {themeOptions.map((option) => {
            const isActive = theme === option.value;
            const isActiveResolved =
              option.value === themes.SYSTEM
                ? theme === themes.SYSTEM
                : resolvedTheme === option.value;

            return (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all ${
                  isActive
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleThemeSelect(option.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{option.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{option.label}</h3>
                        {isActive && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
