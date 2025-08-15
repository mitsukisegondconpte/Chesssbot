import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "../components/dashboard/stats-card";
import { ActivityChart } from "../components/dashboard/activity-chart";
import { TopPlayers } from "../components/dashboard/top-players";
import { RecentGamesTable } from "../components/dashboard/recent-games-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Sword, Trophy, MessageSquare, Bot, Brain, Shield } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  completedGames: number;
  activeTournaments: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 dark:bg-gray-600 h-32 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Utilisateurs Actifs"
          value={stats?.activeUsers || 0}
          change="+12% ce mois"
          changeType="positive"
          icon={Users}
          iconBgColor="bg-blue-100 dark:bg-blue-900"
          iconColor="text-chess-blue"
        />
        <StatsCard
          title="Parties Jouées"
          value={stats?.completedGames || 0}
          change="+8% ce mois"
          changeType="positive"
          icon={Sword}
          iconBgColor="bg-green-100 dark:bg-green-900"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Tournois Actifs"
          value={stats?.activeTournaments || 0}
          change="4 en attente"
          changeType="neutral"
          icon={Trophy}
          iconBgColor="bg-yellow-100 dark:bg-yellow-900"
          iconColor="text-chess-gold"
        />
        <StatsCard
          title="Messages Envoyés"
          value="45,892"
          change="+15% ce mois"
          changeType="positive"
          icon={MessageSquare}
          iconBgColor="bg-purple-100 dark:bg-purple-900"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts and Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart />
        <TopPlayers />
      </div>

      {/* Recent Games Table */}
      <RecentGamesTable />

      {/* Tournament Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-chess-blue to-chess-dark text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tournois Automatisés</h3>
              <Bot className="text-2xl opacity-80 w-8 h-8" />
            </div>
            <p className="text-blue-100 mb-4 text-sm">
              Configurez des tournois automatiques pour engager vos utilisateurs
            </p>
            <Button
              className="bg-white text-chess-blue px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors w-full"
              data-testid="create-automated-tournament"
            >
              Créer un Tournoi Auto
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chess-gold to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Analyses Avancées</h3>
              <Brain className="text-2xl opacity-80 w-8 h-8" />
            </div>
            <p className="text-yellow-100 mb-4 text-sm">
              Analysez les parties avec des suggestions d'amélioration IA
            </p>
            <Button
              className="bg-white text-yellow-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors w-full"
              data-testid="run-analysis"
            >
              Lancer l'Analyse
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sauvegarde Auto</h3>
              <Shield className="text-2xl opacity-80 w-8 h-8" />
            </div>
            <p className="text-green-100 mb-4 text-sm">
              Système de sauvegarde automatique activé pour toutes les parties
            </p>
            <Button
              className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors w-full"
              data-testid="configure-backup"
            >
              Configurer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
