import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface TopPlayer {
  id: string;
  username: string;
  nickname?: string;
  eloRating: number;
  gamesPlayed: number;
  gamesWon: number;
}

export function TopPlayers() {
  const { data: topPlayers, isLoading } = useQuery<TopPlayer[]>({
    queryKey: ['/api/dashboard/top-players'],
  });

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Joueurs ELO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (index: number) => {
    if (index === 0) return "from-chess-gold to-yellow-600";
    if (index === 1) return "from-gray-400 to-gray-600";
    if (index === 2) return "from-orange-400 to-orange-600";
    return "from-gray-300 to-gray-500";
  };

  return (
    <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Top Joueurs ELO
        </CardTitle>
        <Button
          variant="link"
          className="text-chess-blue hover:text-chess-dark text-sm font-medium p-0"
          data-testid="view-all-players"
        >
          Voir tout
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topPlayers?.slice(0, 5).map((player, index) => (
            <div key={player.id} className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 bg-gradient-to-br ${getRankColor(index)} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {player.nickname || player.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  @{player.username}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {player.eloRating}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {player.gamesWon}W
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
