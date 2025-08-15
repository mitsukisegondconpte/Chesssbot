import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Crown, Trophy } from "lucide-react";
import Header from "../components/layout/header";

interface User {
  id: string;
  username: string;
  nickname?: string;
  firstName?: string;
  lastName?: string;
  eloRating: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  isActive: boolean;
  lastActive: string;
  createdAt: string;
}

export default function Users() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Maintenant";
    if (diffInHours === 1) return "Il y a 1h";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hier";
    return `Il y a ${diffInDays}j`;
  };

  const getEloRank = (elo: number) => {
    if (elo >= 2200) return { name: "Maître", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" };
    if (elo >= 1800) return { name: "Expert", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
    if (elo >= 1400) return { name: "Avancé", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
    if (elo >= 1000) return { name: "Intermédiaire", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    return { name: "Débutant", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" };
  };

  return (
    <div className="space-y-6">
      <Header
        title="Utilisateurs"
        subtitle="Gestion et statistiques des utilisateurs du bot d'échecs"
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un utilisateur..."
              className="pl-10 w-80"
              data-testid="search-users"
            />
          </div>
        </div>
        <Button
          className="bg-chess-blue text-white hover:bg-chess-dark"
          data-testid="add-user"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nouvel Utilisateur
        </Button>
      </div>

      <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Liste des Utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
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
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rang ELO</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Victoires</TableHead>
                    <TableHead>% Victoires</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière Activité</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => {
                    const rank = getEloRank(user.eloRating);
                    const winRate = user.gamesPlayed > 0 ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1) : "0";
                    
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-chess-blue to-chess-dark rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {(user.nickname || user.firstName || user.username).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {user.nickname || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {user.eloRating}
                            </span>
                            <Badge className={rank.color}>
                              {rank.name}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.gamesPlayed}
                        </TableCell>
                        <TableCell className="font-medium text-green-600 dark:text-green-400">
                          {user.gamesWon}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${parseFloat(winRate) >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {winRate}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(user.lastActive)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-chess-blue hover:text-chess-dark p-1"
                              data-testid={`view-user-${user.id}`}
                            >
                              <Crown className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 p-1"
                              data-testid={`view-games-${user.id}`}
                            >
                              <Trophy className="w-4 h-4" />
                            </Button>
                          </div>
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
