import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  PieChart,
  Calendar,
  Download
} from "lucide-react";
import Header from "../components/layout/header";

interface GameAnalytics {
  totalGames: number;
  avgAccuracy: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  bestOpenings: string[];
  weakestAreas: string[];
  improvementSuggestions: string[];
}

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<GameAnalytics>({
    queryKey: ['/api/analytics/overview'],
  });

  // Mock data for demonstration
  const mockAnalytics: GameAnalytics = {
    totalGames: 1247,
    avgAccuracy: 78.5,
    blunders: 156,
    mistakes: 423,
    inaccuracies: 789,
    bestOpenings: ["Défense Sicilienne", "Partie Espagnole", "Défense Française"],
    weakestAreas: ["Finales de tours", "Ouvertures d'ailes", "Tactiques de milieu"],
    improvementSuggestions: [
      "Travailler les finales de base",
      "Étudier les plans dans la Défense Sicilienne",
      "Améliorer la vision tactique",
      "Maîtriser les transitions finale"
    ]
  };

  const openingStats = [
    { name: "Défense Sicilienne", games: 234, winRate: 67, avgAccuracy: 82 },
    { name: "Partie Espagnole", games: 189, winRate: 58, avgAccuracy: 79 },
    { name: "Défense Française", games: 156, winRate: 61, avgAccuracy: 76 },
    { name: "Partie Italienne", games: 143, winRate: 55, avgAccuracy: 74 },
    { name: "Défense Caro-Kann", games: 98, winRate: 52, avgAccuracy: 73 }
  ];

  const timeAnalysis = [
    { period: "Cette semaine", games: 23, accuracy: 81, improvement: +3 },
    { period: "Ce mois", games: 97, accuracy: 79, improvement: +1 },
    { period: "3 derniers mois", games: 287, accuracy: 78, improvement: -2 },
    { period: "Cette année", games: 1094, accuracy: 77, improvement: +5 }
  ];

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return "text-green-600 dark:text-green-400";
    if (accuracy >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 85) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (accuracy >= 75) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <div className="space-y-6">
      <Header
        title="Analyses"
        subtitle="Analyses détaillées des performances et suggestions d'amélioration IA"
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">3 derniers mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type d'analyse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Analyse complète</SelectItem>
              <SelectItem value="openings">Ouvertures</SelectItem>
              <SelectItem value="endgames">Finales</SelectItem>
              <SelectItem value="tactics">Tactiques</SelectItem>
              <SelectItem value="time">Gestion du temps</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            className="bg-chess-blue text-white hover:bg-chess-dark"
            data-testid="run-analysis"
          >
            <Brain className="w-4 h-4 mr-2" />
            Nouvelle Analyse IA
          </Button>
          <Button variant="outline" data-testid="export-analytics">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Précision Moyenne
                </p>
                <p className="text-3xl font-bold">
                  {mockAnalytics.avgAccuracy}%
                </p>
                <p className="text-blue-100 text-sm">
                  +2.3% ce mois
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">
                  Bourdes Totales
                </p>
                <p className="text-3xl font-bold">
                  {mockAnalytics.blunders}
                </p>
                <p className="text-red-100 text-sm">
                  -12% ce mois
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">
                  Erreurs Mineures
                </p>
                <p className="text-3xl font-bold">
                  {mockAnalytics.mistakes}
                </p>
                <p className="text-yellow-100 text-sm">
                  -5% ce mois
                </p>
              </div>
              <Activity className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Coups Excellents
                </p>
                <p className="text-3xl font-bold">
                  1,892
                </p>
                <p className="text-green-100 text-sm">
                  +18% ce mois
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend Chart */}
        <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Évolution de la Précision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-chess-blue mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Graphique d'évolution de la précision
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Chart.js integration requise
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Distribution */}
        <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Répartition des Erreurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bourdes</span>
                <div className="flex items-center space-x-2">
                  <Progress value={15} className="w-24" />
                  <span className="text-sm text-red-600 dark:text-red-400">15%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Erreurs</span>
                <div className="flex items-center space-x-2">
                  <Progress value={35} className="w-24" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">35%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Imprécisions</span>
                <div className="flex items-center space-x-2">
                  <Progress value={50} className="w-24" />
                  <span className="text-sm text-orange-600 dark:text-orange-400">50%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opening Analysis */}
        <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Analyse des Ouvertures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {openingStats.map((opening, index) => (
                <div key={index} className="border rounded-lg p-4 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {opening.name}
                    </h4>
                    <Badge className={getAccuracyBadge(opening.avgAccuracy)}>
                      {opening.avgAccuracy}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Parties</p>
                      <p className="font-medium text-gray-900 dark:text-white">{opening.games}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">% Victoires</p>
                      <p className={`font-medium ${opening.winRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {opening.winRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Précision</p>
                      <p className={`font-medium ${getAccuracyColor(opening.avgAccuracy)}`}>
                        {opening.avgAccuracy}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time-based Performance */}
        <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Performance dans le Temps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeAnalysis.map((period, index) => (
                <div key={index} className="border rounded-lg p-4 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {period.period}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getAccuracyBadge(period.accuracy)}>
                        {period.accuracy}%
                      </Badge>
                      <span className={`text-sm font-medium ${period.improvement >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {period.improvement >= 0 ? '+' : ''}{period.improvement}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{period.games} parties jouées</span>
                    <Progress value={period.accuracy} className="w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <Card className="bg-gradient-to-br from-chess-blue to-chess-dark text-white">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Brain className="w-6 h-6 mr-2" />
            Suggestions d'Amélioration IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-blue-100">Points Forts à Maintenir</h4>
              <ul className="space-y-2">
                {mockAnalytics.bestOpenings.map((opening, index) => (
                  <li key={index} className="flex items-center text-blue-100">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
                    {opening}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-blue-100">Axes d'Amélioration Prioritaires</h4>
              <ul className="space-y-2">
                {mockAnalytics.improvementSuggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index} className="flex items-center text-blue-100">
                    <Target className="w-4 h-4 mr-2 text-yellow-300" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
