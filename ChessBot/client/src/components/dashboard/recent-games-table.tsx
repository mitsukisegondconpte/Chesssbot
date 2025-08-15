import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Eye, TrendingUp, Download, Filter } from "lucide-react";

interface Game {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  status: string;
  result: string;
  duration: number;
  whiteEloChange: number;
  blackEloChange: number;
  startedAt: string;
}

export function RecentGamesTable() {
  const { data: recentGames, isLoading } = useQuery<Game[]>({
    queryKey: ['/api/dashboard/recent-games'],
  });

  const getResultBadge = (result: string) => {
    switch (result) {
      case "white_wins":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Victoire Blancs</Badge>;
      case "black_wins":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Victoire Noirs</Badge>;
      case "draw":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Match Nul</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">En cours</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours === 1) return "Il y a 1h";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hier";
    return `Il y a ${diffInDays}j`;
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Parties Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Parties Récentes
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              data-testid="filter-games"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filtrer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              data-testid="export-games"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joueurs
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Résultat
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Durée
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ELO Change
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentGames?.slice(0, 10).map((game) => (
                <TableRow key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 bg-chess-blue rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                          <span className="text-white text-xs font-bold">W</span>
                        </div>
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                          <span className="text-white text-xs font-bold">B</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Partie #{game.id.slice(-6)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Partie classée
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getResultBadge(game.result)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900 dark:text-white">
                    {game.duration ? formatDuration(game.duration) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className={`text-sm font-medium ${game.whiteEloChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {game.whiteEloChange >= 0 ? '+' : ''}{game.whiteEloChange}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(game.startedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-chess-blue hover:text-chess-dark p-1"
                        data-testid={`view-game-${game.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 p-1"
                        data-testid={`analyze-game-${game.id}`}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-600 p-1"
                        data-testid={`download-pgn-${game.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Affichage de <span className="font-medium">1</span> à{" "}
              <span className="font-medium">10</span> sur{" "}
              <span className="font-medium">{recentGames?.length || 0}</span> parties
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="px-3 py-1 text-sm"
                disabled
                data-testid="previous-page"
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-3 py-1 text-sm"
                data-testid="next-page"
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
