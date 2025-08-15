import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-white dark:bg-chess-gray shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-chess-blue dark:hover:text-chess-blue transition-colors"
      data-testid="theme-toggle"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
