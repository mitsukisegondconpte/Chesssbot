import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";

export function ActivityChart() {
  return (
    <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Activité des Parties
        </CardTitle>
        <Select defaultValue="7days">
          <SelectTrigger className="w-[180px] text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-chess-gray text-gray-700 dark:text-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">7 derniers jours</SelectItem>
            <SelectItem value="30days">30 derniers jours</SelectItem>
            <SelectItem value="3months">3 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {/* Chart placeholder - In a real implementation, this would use a charting library like Chart.js or Recharts */}
        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-chess-blue rounded-lg flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="text-white text-2xl w-8 h-8" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Graphique d'activité des parties
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Chart.js integration requise
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
