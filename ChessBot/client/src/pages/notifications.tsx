import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Settings, 
  Check, 
  Clock, 
  Trophy, 
  Users, 
  MessageSquare, 
  Shield,
  Smartphone,
  Mail,
  Volume2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "../components/layout/header";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

interface NotificationSettings {
  gameInvites: boolean;
  tournamentStart: boolean;
  gameReminders: boolean;
  eloChanges: boolean;
  newMessages: boolean;
  systemUpdates: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
}

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId] = useState("admin-user-id"); // In real app, get from auth

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', selectedUserId],
  });

  const { data: unreadNotifications } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', selectedUserId, 'unread'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Notification marquée comme lue",
        description: "La notification a été marquée comme lue avec succès.",
      });
    },
  });

  // Mock notification settings
  const [settings, setSettings] = useState<NotificationSettings>({
    gameInvites: true,
    tournamentStart: true,
    gameReminders: true,
    eloChanges: true,
    newMessages: false,
    systemUpdates: true,
    pushEnabled: true,
    emailEnabled: false,
    soundEnabled: true,
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Paramètre mis à jour",
      description: `Les notifications ${key} ont été ${value ? 'activées' : 'désactivées'}.`,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'game_invite':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'tournament_start':
        return <Trophy className="w-5 h-5 text-chess-gold" />;
      case 'game_reminder':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'system':
        return <Shield className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'game_invite':
        return 'Invitation à jouer';
      case 'tournament_start':
        return 'Début de tournoi';
      case 'game_reminder':
        return 'Rappel de partie';
      case 'system':
        return 'Système';
      default:
        return 'Notification';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  // Mock notifications for demonstration
  const mockNotifications: Notification[] = [
    {
      id: "1",
      userId: selectedUserId,
      type: "tournament_start",
      title: "Tournoi Hebdomadaire",
      message: "Le tournoi hebdomadaire commence dans 30 minutes. Préparez-vous !",
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      userId: selectedUserId,
      type: "game_invite",
      title: "Nouvelle invitation",
      message: "GrandMaître_Fr vous invite à une partie d'échecs.",
      isRead: false,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      userId: selectedUserId,
      type: "game_reminder",
      title: "Partie en attente",
      message: "Vous avez une partie en cours contre StrategeParis.",
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      userId: selectedUserId,
      type: "system",
      title: "Mise à jour du système",
      message: "Nouvelles fonctionnalités d'analyse disponibles.",
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const displayNotifications = notifications || mockNotifications;
  const unreadCount = displayNotifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <Header
        title="Notifications"
        subtitle="Gestion des notifications et paramètres d'alerte"
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Non Lues
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {unreadCount}
                </p>
              </div>
              <Bell className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {displayNotifications.length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Push Activé
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {settings.pushEnabled ? "Oui" : "Non"}
                </p>
              </div>
              <Smartphone className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Email Activé
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {settings.emailEnabled ? "Oui" : "Non"}
                </p>
              </div>
              <Mail className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications Récentes
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    displayNotifications.filter(n => !n.isRead).forEach(n => {
                      markAsReadMutation.mutate(n.id);
                    });
                  }}
                  data-testid="mark-all-read"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {displayNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        notification.isRead
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          : 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {getNotificationTypeLabel(notification.type)}
                            </Badge>
                            {!notification.isRead && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                className="text-xs"
                                data-testid={`mark-read-${notification.id}`}
                              >
                                Marquer comme lu
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notification Settings */}
        <div>
          <Card className="bg-white dark:bg-chess-gray border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Paramètres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Types */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Types de Notifications
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Invitations de jeu
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Recevoir les invitations à jouer
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.gameInvites}
                      onCheckedChange={(checked) => handleSettingChange('gameInvites', checked)}
                      data-testid="toggle-game-invites"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-4 h-4 text-chess-gold" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Début de tournois
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Alertes de début de tournoi
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.tournamentStart}
                      onCheckedChange={(checked) => handleSettingChange('tournamentStart', checked)}
                      data-testid="toggle-tournament-start"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Rappels de parties
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Parties en attente depuis longtemps
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.gameReminders}
                      onCheckedChange={(checked) => handleSettingChange('gameReminders', checked)}
                      data-testid="toggle-game-reminders"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Mises à jour système
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Nouvelles fonctionnalités et maintenance
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.systemUpdates}
                      onCheckedChange={(checked) => handleSettingChange('systemUpdates', checked)}
                      data-testid="toggle-system-updates"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Delivery Methods */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Méthodes de Livraison
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Notifications Push
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Via l'application mobile/web
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.pushEnabled}
                      onCheckedChange={(checked) => handleSettingChange('pushEnabled', checked)}
                      data-testid="toggle-push-notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Notifications Email
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Résumé quotidien par email
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.emailEnabled}
                      onCheckedChange={(checked) => handleSettingChange('emailEnabled', checked)}
                      data-testid="toggle-email-notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Volume2 className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Sons de notification
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sons pour les alertes importantes
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                      data-testid="toggle-sound-notifications"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full bg-chess-blue text-white hover:bg-chess-dark"
                  data-testid="save-notification-settings"
                >
                  Sauvegarder les Paramètres
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
