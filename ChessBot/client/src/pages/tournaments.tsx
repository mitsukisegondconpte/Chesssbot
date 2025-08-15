import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Users, Calendar, Trophy, Settings } from "lucide-react";
import Header from "../components/layout/header";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  status: string;
  maxParticipants: number;
  currentParticipants: number;
  isAutomated: boolean;
  startTime?: string;
  endTime?: string;
  winnerId?: string;
  createdAt: string;
}

export default function Tournaments() {
  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  const { data: activeTournaments } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments/active'],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">À venir</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">En cours</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Terminé</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Annulé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Tournois"
        subtitle="Gestion et organisation des tournois d'échecs"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tournois Actifs
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeTournaments?.length || 0}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Tournois
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tournaments?.length || 0}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tournois Automatisés
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tournaments?.filter(t => t.isAutomated).length || 0}
                </p>
              </div>
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Participants Actifs
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tournaments?.reduce((sum, t) => sum + t.currentParticipants, 0) || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un tournoi..."
              className="pl-10 w-80"
              data-testid="search-tournaments"
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les tournois</SelectItem>
              <SelectItem value="upcoming">À venir</SelectItem>
              <SelectItem value="active">En cours</SelectItem>
              <SelectItem value="completed">Terminés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            data-testid="create-automated-tournament"
          >
            <Settings className="w-4 h-4 mr-2" />
            Tournoi Auto
          </Button>
          <Button
            className="bg-chess-blue text-white hover:bg-chess-dark"
            data-testid="create-tournament"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Tournoi
          </Button>
        </div>
      </div>

      {/* Active Tournaments Highlight */}
      {activeTournaments && activeTournaments.length > 0 && (
        <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Tournois en Cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTournaments.slice(0, 3).map((tournament) => (
                <Card key={tournament.id} className="bg-white dark:bg-chess-gray">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {tournament.name}
                      </h4>
                      {tournament.isAutomated && (
                        <Badge variant="outline" className="text-xs">
                          Auto
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Participants</span>
                        <span className="font-medium">
                          {tournament.currentParticipants}/{tournament.maxParticipants}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${getProgressPercentage(tournament.currentParticipants, tournament.maxParticipants)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournaments Table */}
      <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Tous les Tournois
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
                    <TableHead>Nom du Tournoi</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date de Début</TableHead>
                    <TableHead>Date de Fin</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournaments?.map((tournament) => (
                    <TableRow key={tournament.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {tournament.name}
                          </div>
                          {tournament.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {tournament.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(tournament.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {tournament.currentParticipants}/{tournament.maxParticipants}
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-chess-blue h-2 rounded-full"
                              style={{ width: `${getProgressPercentage(tournament.currentParticipants, tournament.maxParticipants)}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tournament.isAutomated ? "default" : "outline"}>
                          {tournament.isAutomated ? "Automatisé" : "Manuel"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(tournament.startTime)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(tournament.endTime)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-chess-blue hover:text-chess-dark p-1"
                            data-testid={`view-tournament-${tournament.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 p-1"
                            data-testid={`manage-tournament-${tournament.id}`}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700 p-1"
                            data-testid={`participants-tournament-${tournament.id}`}
                          >
                            <Users className="w-4 h-4" />
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
