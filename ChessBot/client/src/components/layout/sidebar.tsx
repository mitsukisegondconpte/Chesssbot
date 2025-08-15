import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Users,
  Sword,
  Trophy,
  Crown,
  PieChart,
  Bell,
  LogOut,
} from "lucide-react";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Tableau de Bord",
    icon: BarChart3,
  },
  {
    href: "/users",
    label: "Utilisateurs",
    icon: Users,
  },
  {
    href: "/games",
    label: "Parties",
    icon: Sword,
  },
  {
    href: "/tournaments",
    label: "Tournois",
    icon: Trophy,
  },
  {
    href: "/rankings",
    label: "Classement ELO",
    icon: Crown,
  },
  {
    href: "/analytics",
    label: "Analyses",
    icon: PieChart,
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    badge: 3,
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === href;
  };

  return (
    <div className="w-64 bg-white dark:bg-chess-gray shadow-xl border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-chess-blue rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">♔</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">Sword Bot</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                      active
                        ? "bg-chess-blue text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-chess-gold text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-chess-blue to-chess-dark rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Admin</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Connecté</p>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
