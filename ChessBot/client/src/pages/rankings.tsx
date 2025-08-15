import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Crown, Trophy, TrendingUp, Users, Medal, Star } from "lucide-react";
import Header from "../components/layout/header";

interface Player {
  id: string;
  username: string;
  nickname?: string;
  firstName?: string;
  eloRating: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  winRate: number;
  rank: number;
  eloChange: number;
}

export default function Rankings() {
  const { data: topPlayers, isLoading } = useQuery<Player[]>({
    queryKey: ['/api/dashboard/top-players'],
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-chess-gold" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
  };

  const getEloCategory = (elo: number) => {
    if (elo >= 2400) return { name: "Super Grand Maître", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" };
    if (elo >= 2200) return { name: "Grand Maître", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    if (elo >= 2000) return { name: "Maître International", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" };
    if (elo >= 1800) return { name: "Expert", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
    if (elo >= 1600) return { name: "Joueur Classé", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
    if (elo >= 1400) return { name: "Joueur Club", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    if (elo >= 1200) return { name: "Débutant Avancé", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" };
    return { name: "Débutant", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" };
  };

  const formatWinRate = (winRate: number) => {
    return `${winRate.toFixed(1)}%`;
  };

  // Mock data for demonstration since we don't have real ranking data
  const mockTopPlayers: Player[] = topPlayers?.map((player, index) => ({
    ...player,
    rank: index + 1,
    winRate: player.gamesPlayed > 0 ? (player.gamesWon / player.gamesPlayed) * 100 : 0,
    eloChange: Math.floor(Math.random() * 100) - 50, // Random for demo
    gamesDrawn: player.gamesPlayed - player.gamesWon - (player.gamesLost || 0),
    gamesLost: player.gamesLost || player.gamesPlayed - player.gamesWon
  })) || [];

  return (
    <div className="space-y-6">
      <Header
        title="Classement ELO"
        subtitle="Classement officiel des joueurs d'échecs par rating ELO"
      />

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockTopPlayers.slice(0, 3).map((player, index) => {
          const category = getEloCategory(player.eloRating);
          return (
            <Card 
              key={player.id} 
              className={`relative overflow-hidden ${index === 0 ? 'border-chess-gold shadow-lg' : index === 1 ? 'border-gray-400' : 'border-orange-400'}`}
            >
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                    index === 0 ? 'bg-gradient-to-br from-chess-gold to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                    'bg-gradient-to-br from-orange-400 to-orange-600'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {player.nickname || player.firstName || player.username}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  @{player.username}
                </p>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-chess-blue">
                    {player.eloRating}
                  </div>
                  <Badge className={category.color}>
                    {category.name}
                  </Badge>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {player.gamesPlayed} parties • {formatWinRate(player.winRate)} victoires
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Joueurs Classés
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {mockTopPlayers.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ELO Moyen
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {mockTopPlayers.length > 0 ? Math.round(mockTopPlayers.reduce((sum, p) => sum + p.eloRating, 0) / mockTopPlayers.length) : 0}
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
                  Grands Maîtres
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {mockTopPlayers.filter(p => p.eloRating >= 2200).length}
                </p>
              </div>
              <Crown className="w-8 h-8 text-chess-gold" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Plus Haut ELO
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {mockTopPlayers.length > 0 ? Math.max(...mockTopPlayers.map(p => p.eloRating)) : 0}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-500" />
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
              placeholder="Rechercher un joueur..."
              className="pl-10 w-80"
              data-testid="search-players"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="grandmaster">Grand Maître (2200+)</SelectItem>
              <SelectItem value="master">Maître (2000+)</SelectItem>
              <SelectItem value="expert">Expert (1800+)</SelectItem>
              <SelectItem value="advanced">Avancé (1400+)</SelectItem>
              <SelectItem value="beginner">Débutant (-1400)</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="elo">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elo">ELO Décroissant</SelectItem>
              <SelectItem value="games">Parties Jouées</SelectItem>
              <SelectItem value="winrate">Taux de Victoire</SelectItem>
              <SelectItem value="recent">Activité Récente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" data-testid="export-rankings">
          <Trophy className="w-4 h-4 mr-2" />
          Exporter Classement
        </Button>
      </div>

      {/* Rankings Table */}
      <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Classement Complet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rang</TableHead>
                    <TableHead>Joueur</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>ELO</TableHead>
                    <TableHead>Variation</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Victoires</TableHead>
                    <TableHead>Défaites</TableHead>
                    <TableHead>Nuls</TableHead>
                    <TableHead>% Victoires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTopPlayers.map((player) => {
                    const category = getEloCategory(player.eloRating);
                    return (
                      <TableRow key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getRankIcon(player.rank)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-chess-blue to-chess-dark text-white">
                                {(player.nickname || player.firstName || player.username).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {player.nickname || `${player.firstName || ''}`.trim() || player.username}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                @{player.username}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={category.color}>
                            {category.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-lg font-bold text-chess-blue">
                            {player.eloRating}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${player.eloChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {player.eloChange >= 0 ? '+' : ''}{player.eloChange}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {player.gamesPlayed}
                        </TableCell>
                        <TableCell className="font-medium text-green-600 dark:text-green-400">
                          {player.gamesWon}
                        </TableCell>
                        <TableCell className="font-medium text-red-600 dark:text-red-400">
                          {player.gamesLost}
                        </TableCell>
                        <TableCell className="font-medium text-gray-600 dark:text-gray-400">
                          {player.gamesDrawn}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${player.winRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatWinRate(player.winRate)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
