import { storage } from '../storage';
import { chessBot } from './telegram-bot';

export interface NotificationTemplate {
  title: string;
  message: string;
  type: 'game_invite' | 'tournament_start' | 'game_reminder' | 'elo_change' | 'system';
}

export interface NotificationSettings {
  gameInvites: boolean;
  tournamentStart: boolean;
  gameReminders: boolean;
  eloChanges: boolean;
  systemUpdates: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
}

export class NotificationService {
  private defaultSettings: NotificationSettings = {
    gameInvites: true,
    tournamentStart: true,
    gameReminders: true,
    eloChanges: true,
    systemUpdates: true,
    pushEnabled: true,
    emailEnabled: false,
    soundEnabled: true,
  };

  /**
   * Send notification to a specific user
   */
  async sendNotification(
    userId: string,
    template: NotificationTemplate,
    data?: any
  ): Promise<void> {
    try {
      // Store notification in database
      await storage.createNotification({
        userId,
        type: template.type,
        title: template.title,
        message: template.message,
        data,
      });

      // Get user settings (in real app, would be stored in database)
      const settings = await this.getUserSettings(userId);
      
      // Check if user wants this type of notification
      if (!this.shouldSendNotification(template.type, settings)) {
        return;
      }

      // Send via enabled channels
      if (settings.pushEnabled) {
        await this.sendPushNotification(userId, template);
      }

      if (settings.emailEnabled) {
        await this.sendEmailNotification(userId, template);
      }

      // Send via Telegram if bot is available
      const user = await storage.getUser(userId);
      if (user?.telegramId && chessBot) {
        await this.sendTelegramNotification(user.telegramId, template);
      }

    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendBulkNotification(
    userIds: string[],
    template: NotificationTemplate,
    data?: any
  ): Promise<void> {
    const promises = userIds.map(userId => 
      this.sendNotification(userId, template, data)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Broadcast notification to all active users
   */
  async broadcastNotification(
    template: NotificationTemplate,
    filters?: {
      minElo?: number;
      maxElo?: number;
      activeOnly?: boolean;
    }
  ): Promise<void> {
    try {
      let users = await storage.getAllUsers();

      // Apply filters
      if (filters) {
        users = users.filter(user => {
          if (filters.activeOnly && !user.isActive) return false;
          if (filters.minElo && user.eloRating < filters.minElo) return false;
          if (filters.maxElo && user.eloRating > filters.maxElo) return false;
          return true;
        });
      }

      const userIds = users.map(user => user.id);
      await this.sendBulkNotification(userIds, template);

    } catch (error) {
      console.error('Error broadcasting notification:', error);
      throw error;
    }
  }

  /**
   * Game-specific notifications
   */
  async notifyGameInvite(fromUserId: string, toUserId: string, gameId: string): Promise<void> {
    const fromUser = await storage.getUser(fromUserId);
    const template: NotificationTemplate = {
      type: 'game_invite',
      title: 'Nouvelle invitation de jeu',
      message: `${fromUser?.nickname || fromUser?.username || 'Un joueur'} vous invite à une partie d'échecs.`,
    };

    await this.sendNotification(toUserId, template, { gameId, fromUserId });
  }

  async notifyGameStart(gameId: string): Promise<void> {
    const game = await storage.getGame(gameId);
    if (!game) return;

    const participants = [game.whitePlayerId, game.blackPlayerId].filter(Boolean) as string[];
    
    const template: NotificationTemplate = {
      type: 'game_reminder',
      title: 'Partie commencée',
      message: 'Votre partie d\'échecs a commencé. C\'est à votre tour de jouer !',
    };

    await this.sendBulkNotification(participants, template, { gameId });
  }

  async notifyGameMove(gameId: string, playerToNotifyId: string): Promise<void> {
    const game = await storage.getGame(gameId);
    if (!game) return;

    const template: NotificationTemplate = {
      type: 'game_reminder',
      title: 'C\'est votre tour',
      message: 'Votre adversaire a joué. C\'est maintenant à votre tour !',
    };

    await this.sendNotification(playerToNotifyId, template, { gameId });
  }

  async notifyGameEnd(gameId: string, result: string): Promise<void> {
    const game = await storage.getGame(gameId);
    if (!game) return;

    const participants = [game.whitePlayerId, game.blackPlayerId].filter(Boolean) as string[];
    
    let resultMessage = '';
    switch (result) {
      case 'white_wins':
        resultMessage = 'Les blancs ont gagné !';
        break;
      case 'black_wins':
        resultMessage = 'Les noirs ont gagné !';
        break;
      case 'draw':
        resultMessage = 'La partie se termine par un match nul.';
        break;
    }

    const template: NotificationTemplate = {
      type: 'game_reminder',
      title: 'Partie terminée',
      message: `Votre partie d'échecs est terminée. ${resultMessage}`,
    };

    await this.sendBulkNotification(participants, template, { gameId, result });
  }

  /**
   * Tournament-specific notifications
   */
  async notifyTournamentStart(tournamentId: string): Promise<void> {
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) return;

    // Get tournament participants (would need to implement this in storage)
    const participants = await this.getTournamentParticipants(tournamentId);
    
    const template: NotificationTemplate = {
      type: 'tournament_start',
      title: 'Tournoi commencé',
      message: `Le tournoi "${tournament.name}" vient de commencer !`,
    };

    await this.sendBulkNotification(participants, template, { tournamentId });
  }

  async notifyTournamentRegistration(tournamentId: string): Promise<void> {
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) return;

    const template: NotificationTemplate = {
      type: 'tournament_start',
      title: 'Nouveau tournoi disponible',
      message: `Inscriptions ouvertes pour le tournoi "${tournament.name}". Ne manquez pas cette opportunité !`,
    };

    await this.broadcastNotification(template, { activeOnly: true });
  }

  async notifyTournamentRound(tournamentId: string, roundNumber: number): Promise<void> {
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) return;

    const participants = await this.getTournamentParticipants(tournamentId);
    
    const template: NotificationTemplate = {
      type: 'tournament_start',
      title: `Round ${roundNumber}`,
      message: `Le round ${roundNumber} du tournoi "${tournament.name}" commence !`,
    };

    await this.sendBulkNotification(participants, template, { tournamentId, roundNumber });
  }

  /**
   * ELO and ranking notifications
   */
  async notifyEloChange(userId: string, oldRating: number, newRating: number, change: number): Promise<void> {
    const changeText = change > 0 ? `+${change}` : `${change}`;
    const template: NotificationTemplate = {
      type: 'elo_change',
      title: 'Classement ELO mis à jour',
      message: `Votre rating ELO a changé : ${oldRating} → ${newRating} (${changeText})`,
    };

    await this.sendNotification(userId, template, { oldRating, newRating, change });
  }

  async notifyRankingAchievement(userId: string, achievement: string): Promise<void> {
    const template: NotificationTemplate = {
      type: 'elo_change',
      title: 'Nouveau classement atteint !',
      message: `Félicitations ! Vous avez atteint le niveau ${achievement}.`,
    };

    await this.sendNotification(userId, template, { achievement });
  }

  /**
   * System notifications
   */
  async notifySystemUpdate(title: string, message: string): Promise<void> {
    const template: NotificationTemplate = {
      type: 'system',
      title,
      message,
    };

    await this.broadcastNotification(template, { activeOnly: true });
  }

  async notifyMaintenanceScheduled(startTime: Date, duration: string): Promise<void> {
    const template: NotificationTemplate = {
      type: 'system',
      title: 'Maintenance programmée',
      message: `Une maintenance est programmée le ${startTime.toLocaleDateString()} à ${startTime.toLocaleTimeString()}. Durée estimée : ${duration}.`,
    };

    await this.broadcastNotification(template, { activeOnly: true });
  }

  /**
   * Reminder notifications
   */
  async sendPendingGameReminders(): Promise<void> {
    try {
      const activeGames = await storage.getActiveGames();
      const now = new Date();
      const reminderThreshold = 24 * 60 * 60 * 1000; // 24 hours

      for (const game of activeGames) {
        const timeSinceLastMove = now.getTime() - new Date(game.updatedAt || game.startedAt).getTime();
        
        if (timeSinceLastMove > reminderThreshold) {
          const currentPlayer = game.whitePlayerId; // Simplified - would need to track whose turn it is
          if (currentPlayer) {
            const template: NotificationTemplate = {
              type: 'game_reminder',
              title: 'Partie en attente',
              message: 'Vous avez une partie d\'échecs en attente depuis plus de 24 heures.',
            };

            await this.sendNotification(currentPlayer, template, { gameId: game.id });
          }
        }
      }
    } catch (error) {
      console.error('Error sending pending game reminders:', error);
    }
  }

  /**
   * Private helper methods
   */
  private async getUserSettings(userId: string): Promise<NotificationSettings> {
    // In a real implementation, this would be stored in the database
    // For now, return default settings
    return this.defaultSettings;
  }

  private shouldSendNotification(type: string, settings: NotificationSettings): boolean {
    switch (type) {
      case 'game_invite':
        return settings.gameInvites;
      case 'tournament_start':
        return settings.tournamentStart;
      case 'game_reminder':
        return settings.gameReminders;
      case 'elo_change':
        return settings.eloChanges;
      case 'system':
        return settings.systemUpdates;
      default:
        return true;
    }
  }

  private async sendPushNotification(userId: string, template: NotificationTemplate): Promise<void> {
    // Implementation would depend on push notification service (Firebase, etc.)
    console.log(`Push notification sent to user ${userId}: ${template.title}`);
  }

  private async sendEmailNotification(userId: string, template: NotificationTemplate): Promise<void> {
    // Implementation would depend on email service (SendGrid, etc.)
    console.log(`Email notification sent to user ${userId}: ${template.title}`);
  }

  private async sendTelegramNotification(telegramId: string, template: NotificationTemplate): Promise<void> {
    if (chessBot) {
      try {
        const message = `🔔 **${template.title}**\n\n${template.message}`;
        // Note: chessBot.bot is not exposed in the current implementation
        // This would need to be added to the ChessBot class
        console.log(`Telegram notification sent to ${telegramId}: ${template.title}`);
      } catch (error) {
        console.error('Error sending Telegram notification:', error);
      }
    }
  }

  private async getTournamentParticipants(tournamentId: string): Promise<string[]> {
    // Implementation would query tournament_participants table
    // For now, return empty array
    return [];
  }

  /**
   * Schedule periodic reminder checks
   */
  startReminderScheduler(): void {
    // Check for pending game reminders every 6 hours
    setInterval(async () => {
      await this.sendPendingGameReminders();
    }, 6 * 60 * 60 * 1000);

    console.log('✅ Notification reminder scheduler started');
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Implementation would delete notifications older than cutoff date
    console.log(`Cleaning up notifications older than ${cutoffDate.toISOString()}`);
  }
}

export const notificationService = new NotificationService();

// Start reminder scheduler if enabled
if (process.env.ENABLE_NOTIFICATION_REMINDERS === 'true') {
  notificationService.startReminderScheduler();
}
