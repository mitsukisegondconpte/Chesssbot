import { ThemeToggle } from "../theme-toggle";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({
  title = "Tableau de Bord",
  subtitle = "Vue d'ensemble des activités du bot d'échecs",
}: HeaderProps) {
  return (
    <header className="bg-white dark:bg-chess-gray shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            className="bg-chess-blue text-white px-4 py-2 rounded-lg hover:bg-chess-dark transition-colors flex items-center space-x-2"
            data-testid="new-tournament-button"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Tournoi</span>
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative"
              data-testid="notification-button"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
