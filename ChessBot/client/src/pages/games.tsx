import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, TrendingUp, Download, Play } from "lucide-react";
import Header from "../components/layout/header";

interface Game {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  status: string;
  result: string;
  boardState: string;
  duration: number;
  whiteEloChange: number;
  blackEloChange: number;
  startedAt: string;
  completedAt?: string;
  isRated: boolean;
}

export default function Games() {
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  const { data: activeGames } = useQuery<Game[]>({
    queryKey: ['/api/games/active'],
  });

  const getStatusBadge = (status: string, result?: string) => {
    if (status === 'active') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">En cours</Badge>;
    }
    
    if (status === 'completed') {
      switch (result) {
        case "white_wins":
          return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Victoire Blancs</Badge>;
        case "black_wins":
          return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Victoire Noirs</Badge>;
        case "draw":
          return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Match Nul</Badge>;
        default:
          return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Terminée</Badge>;
      }
    }
    
    if (status === 'abandoned') {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Abandonnée</Badge>;
    }

    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">{status}</Badge>;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
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

  return (
    <div className="space-y-6">
      <Header
        title="Parties"
        subtitle="Suivi et gestion de toutes les parties d'échecs"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Parties Actives
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeGames?.length || 0}
                </p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Parties
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {games?.length || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Parties Terminées
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {games?.filter(g => g.status === 'completed').length || 0}
                </p>
              </div>
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">✓</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Durée Moyenne
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  25m
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une partie..."
              className="pl-10 w-80"
              data-testid="search-games"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les parties</SelectItem>
              <SelectItem value="active">En cours</SelectItem>
              <SelectItem value="completed">Terminées</SelectItem>
              <SelectItem value="abandoned">Abandonnées</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="rated">Parties classées</SelectItem>
              <SelectItem value="unrated">Parties amicales</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" data-testid="filter-games">
            <Filter className="w-4 h-4 mr-2" />
            Filtres Avancés
          </Button>
          <Button variant="outline" data-testid="export-games">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Games Table */}
      <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Toutes les Parties
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partie</TableHead>
                    <TableHead>Joueurs</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Changement ELO</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games?.map((game) => (
                    <TableRow key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          #{game.id.slice(-8)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 bg-chess-blue rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                              <span className="text-white text-xs font-bold">W</span>
                            </div>
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                              <span className="text-white text-xs font-bold">B</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">vs</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(game.status, game.result)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={game.isRated ? "default" : "outline"}>
                          {game.isRated ? "Classée" : "Amicale"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDuration(game.duration)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`text-sm ${game.whiteEloChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            W: {game.whiteEloChange >= 0 ? '+' : ''}{game.whiteEloChange}
                          </div>
                          <div className={`text-sm ${game.blackEloChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            B: {game.blackEloChange >= 0 ? '+' : ''}{game.blackEloChange}
                          </div>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
