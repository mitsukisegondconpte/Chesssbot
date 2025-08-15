import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { chessEngine } from './chess-engine';
import { calculateEloChange } from './elo-calculator';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface GameSession {
  chatId: number;
  userId: string;
  board: string; // FEN notation
  gameId?: string;
  isPlayerTurn: boolean;
  skillLevel: number;
}

export class ChessBot {
  private bot: TelegramBot;
  private activeSessions: Map<number, GameSession> = new Map();
  private BOT_TOKEN: string;

  constructor(token: string) {
    this.BOT_TOKEN = token;
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
  }

  private setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStart(msg);
    });

    // New game command
    this.bot.onText(/\/new/, async (msg) => {
      await this.handleNewGame(msg);
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelp(msg);
    });

    // Stats command
    this.bot.onText(/\/stats/, async (msg) => {
      await this.handleStats(msg);
    });

    // Handle callback queries (button presses)
    this.bot.on('callback_query', async (query) => {
      await this.handleCallbackQuery(query);
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });

    this.bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });
  }

  private async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const user = msg.from;

    if (!user) return;

    try {
      // Check if user exists in database
      let dbUser = await storage.getUserByTelegramId(user.id.toString());

      if (!dbUser) {
        // Create new user
        dbUser = await storage.createUser({
          telegramId: user.id.toString(),
          username: user.username || `user_${user.id}`,
          firstName: user.first_name,
          lastName: user.last_name,
          eloRating: 1200,
          isActive: true,
        });
      } else {
        // Update last active
        await storage.updateUser(dbUser.id, {
          lastActive: new Date(),
          isActive: true,
        });
      }

      const welcomeMessage = `🏆 **Bot d'Échecs Français** 🏆

Bonjour ${user.first_name} ! 

Bienvenue dans votre bot d'échecs personnel. Vous pouvez jouer contre le moteur Stockfish.

🎯 **Fonctionnalités :**
♟️ Parties individuelles isolées
🎨 Échiquier visuel en français
🤖 IA Stockfish niveau réglable  
📸 Export PNG/FEN/PGN
🏆 Système de classement ELO

Utilisez les boutons ci-dessous pour commencer !`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🆕 Nouvelle Partie', callback_data: 'new_game' },
            { text: '📊 Mes Statistiques', callback_data: 'stats' }
          ],
          [
            { text: '🏆 Classement', callback_data: 'rankings' },
            { text: '❓ Aide', callback_data: 'help' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error in handleStart:', error);
      await this.bot.sendMessage(chatId, '❌ Une erreur est survenue. Veuillez réessayer.');
    }
  }

  private async handleNewGame(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const user = msg.from;

    if (!user) return;

    try {
      const dbUser = await storage.getUserByTelegramId(user.id.toString());
      if (!dbUser) {
        await this.bot.sendMessage(chatId, '❌ Utilisateur non trouvé. Utilisez /start pour vous enregistrer.');
        return;
      }

      // Create new game in database
      const game = await storage.createGame({
        whitePlayerId: dbUser.id,
        blackPlayerId: null, // Playing against engine
        status: 'active',
        boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moveHistory: [],
        isRated: true,
      });

      // Create game session
      const session: GameSession = {
        chatId,
        userId: dbUser.id,
        board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        gameId: game.id,
        isPlayerTurn: true,
        skillLevel: 5
      };

      this.activeSessions.set(chatId, session);

      // Send board image and move options
      await this.sendBoardWithMoves(chatId, session);

    } catch (error) {
      console.error('Error in handleNewGame:', error);
      await this.bot.sendMessage(chatId, '❌ Erreur lors de la création de la partie.');
    }
  }

  private async handleStats(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const user = msg.from;

    if (!user) return;

    try {
      const dbUser = await storage.getUserByTelegramId(user.id.toString());
      if (!dbUser) {
        await this.bot.sendMessage(chatId, '❌ Utilisateur non trouvé. Utilisez /start pour vous enregistrer.');
        return;
      }

      const userStats = await storage.getUserStats(dbUser.id);
      const winRate = userStats.stats.totalGames > 0 
        ? ((userStats.stats.wins / userStats.stats.totalGames) * 100).toFixed(1)
        : '0';

      const statsMessage = `📊 **Vos Statistiques**

👤 **Joueur :** ${userStats.nickname || userStats.firstName || userStats.username}
🏆 **Rating ELO :** ${userStats.eloRating}

📈 **Performances :**
🎮 Parties jouées : ${userStats.stats.totalGames}
✅ Victoires : ${userStats.stats.wins}
❌ Défaites : ${userStats.stats.losses}
⚖️ Nuls : ${userStats.stats.draws}
📊 Taux de victoire : ${winRate}%

📅 **Dernière activité :** ${new Date(userStats.lastActive).toLocaleDateString('fr-FR')}`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🆕 Nouvelle Partie', callback_data: 'new_game' },
            { text: '🏆 Classement Global', callback_data: 'rankings' }
          ],
          [
            { text: '📈 Historique Détaillé', callback_data: 'history' },
            { text: '🏠 Menu Principal', callback_data: 'main_menu' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, statsMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error in handleStats:', error);
      await this.bot.sendMessage(chatId, '❌ Erreur lors de la récupération des statistiques.');
    }
  }

  private async handleHelp(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    const helpMessage = `📖 **Aide - Bot d'Échecs**

🎯 **Comment jouer :**
1️⃣ Utilisez /new ou cliquez sur "Nouvelle partie"
2️⃣ Les coups disponibles sont affichés sous l'échiquier
3️⃣ Cliquez sur un coup pour le jouer
4️⃣ L'IA joue automatiquement après vous

♟️ **Commandes disponibles :**
/start - Menu principal
/new - Nouvelle partie
/stats - Vos statistiques
/help - Cette aide
/settings - Paramètres

🏆 **Système ELO :**
• Rating de départ : 1200
• Gain/perte selon le résultat
• Classement global disponible

📸 **Fonctionnalités :**
• Export PNG de l'échiquier
• Export PGN de la partie
• Analyse des coups
• Suggestions d'amélioration

🤖 **Moteur Stockfish :**
• Niveau réglable (1-20)
• Niveau par défaut : 5
• Temps de réflexion : 0.8s`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🆕 Nouvelle Partie', callback_data: 'new_game' },
          { text: '⚙️ Paramètres', callback_data: 'settings' }
        ],
        [
          { text: '🏠 Menu Principal', callback_data: 'main_menu' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, helpMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    const chatId = query.message?.chat.id;
    const data = query.data;
    const user = query.from;

    if (!chatId || !data || !user) return;

    try {
      await this.bot.answerCallbackQuery(query.id);

      switch (data) {
        case 'new_game':
          await this.createNewGame(chatId, user);
          break;
        case 'stats':
          await this.showUserStats(chatId, user);
          break;
        case 'help':
          await this.showHelp(chatId);
          break;
        case 'rankings':
          await this.showRankings(chatId);
          break;
        case 'main_menu':
          await this.showMainMenu(chatId, user);
          break;
        default:
          if (data.startsWith('move_')) {
            const move = data.substring(5);
            await this.handleMove(chatId, user, move);
          } else if (data.startsWith('skill_')) {
            const level = parseInt(data.substring(6));
            await this.changeSkillLevel(chatId, level);
          }
          break;
      }

    } catch (error) {
      console.error('Error in handleCallbackQuery:', error);
      await this.bot.sendMessage(chatId, '❌ Une erreur est survenue.');
    }
  }

  private async sendBoardWithMoves(chatId: number, session: GameSession) {
    // In a real implementation, this would generate a visual chess board
    // For now, we'll send a text representation and move buttons
    
    const boardMessage = `♟️ **Partie en Cours**

Position : ${session.board}

${session.isPlayerTurn ? '🟢 À votre tour' : '🔴 Tour de l\'IA'}`;

    // Generate available moves (simplified)
    const moves = await this.getAvailableMoves(session.board);
    const keyboard = this.createMoveKeyboard(moves);

    await this.bot.sendMessage(chatId, boardMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async getAvailableMoves(fen: string): Promise<string[]> {
    // In a real implementation, this would use chess.js or similar
    // to get legal moves from the FEN position
    return ['e2e4', 'e2e3', 'd2d4', 'd2d3', 'g1f3', 'b1c3'];
  }

  private createMoveKeyboard(moves: string[]): TelegramBot.InlineKeyboardMarkup {
    const buttons = moves.map(move => [{
      text: move,
      callback_data: `move_${move}`
    }]);

    // Add game control buttons
    buttons.push([
      { text: '📊 Statistiques', callback_data: 'stats' },
      { text: '🏳️ Abandonner', callback_data: 'resign' }
    ]);

    return { inline_keyboard: buttons };
  }

  private async handleMove(chatId: number, user: TelegramBot.User, move: string) {
    const session = this.activeSessions.get(chatId);
    if (!session || !session.isPlayerTurn) {
      await this.bot.sendMessage(chatId, '❌ Aucune partie en cours ou ce n\'est pas votre tour.');
      return;
    }

    try {
      // Validate move
      const isValid = await chessEngine.validateMove(session.board, move);
      if (!isValid) {
        await this.bot.sendMessage(chatId, '❌ Coup illégal !');
        return;
      }

      // Apply move and update board state
      // In a real implementation, this would use chess.js
      session.board = this.applyMove(session.board, move);
      session.isPlayerTurn = false;

      // Check if game is over
      const gameOver = await this.checkGameOver(session.board);
      if (gameOver) {
        await this.handleGameEnd(chatId, session, gameOver);
        return;
      }

      // Get AI move
      const aiMove = await chessEngine.getBestMove(session.board, 12, 800);
      session.board = this.applyMove(session.board, aiMove.uci);
      session.isPlayerTurn = true;

      // Update board display
      await this.sendBoardWithMoves(chatId, session);

    } catch (error) {
      console.error('Error in handleMove:', error);
      await this.bot.sendMessage(chatId, '❌ Erreur lors du coup.');
    }
  }

  private applyMove(fen: string, move: string): string {
    // Simplified move application - in reality would use chess.js
    return fen;
  }

  private async checkGameOver(fen: string): Promise<string | null> {
    // Simplified game over detection
    return null;
  }

  private async handleGameEnd(chatId: number, session: GameSession, result: string) {
    // Update game in database
    if (session.gameId) {
      await storage.updateGame(session.gameId, {
        status: 'completed',
        result: result as any,
        completedAt: new Date(),
      });

      // Update ELO ratings
      const dbUser = await storage.getUser(session.userId);
      if (dbUser) {
        const eloChange = calculateEloChange(dbUser.eloRating, 1500, result); // AI rating 1500
        await storage.updateUser(session.userId, {
          eloRating: dbUser.eloRating + eloChange,
          gamesPlayed: dbUser.gamesPlayed + 1,
          gamesWon: result === 'white_wins' ? dbUser.gamesWon + 1 : dbUser.gamesWon,
        });
      }
    }

    // Remove session
    this.activeSessions.delete(chatId);

    // Send game over message
    const endMessage = `🏁 **Partie Terminée**

Résultat : ${result}
${result === 'white_wins' ? '🏆 Félicitations, vous avez gagné !' : 
  result === 'black_wins' ? '😔 L\'IA a gagné cette fois.' : 
  '🤝 Match nul !'}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🆕 Nouvelle Partie', callback_data: 'new_game' },
          { text: '📊 Mes Stats', callback_data: 'stats' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, endMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async createNewGame(chatId: number, user: TelegramBot.User) {
    // Delegate to handleNewGame logic
    await this.handleNewGame({ chat: { id: chatId }, from: user } as TelegramBot.Message);
  }

  private async showUserStats(chatId: number, user: TelegramBot.User) {
    // Delegate to handleStats logic
    await this.handleStats({ chat: { id: chatId }, from: user } as TelegramBot.Message);
  }

  private async showHelp(chatId: number) {
    // Delegate to handleHelp logic
    await this.handleHelp({ chat: { id: chatId } } as TelegramBot.Message);
  }

  private async showRankings(chatId: number) {
    try {
      const topPlayers = await storage.getTopPlayers(10);
      
      let rankingsMessage = '🏆 **Classement des Meilleurs Joueurs**\n\n';
      
      topPlayers.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        rankingsMessage += `${medal} ${player.nickname || player.username} - ${player.eloRating} ELO\n`;
      });

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🆕 Nouvelle Partie', callback_data: 'new_game' },
            { text: '🏠 Menu Principal', callback_data: 'main_menu' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, rankingsMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error in showRankings:', error);
      await this.bot.sendMessage(chatId, '❌ Erreur lors de l\'affichage du classement.');
    }
  }

  private async showMainMenu(chatId: number, user: TelegramBot.User) {
    // Delegate to handleStart logic
    await this.handleStart({ chat: { id: chatId }, from: user } as TelegramBot.Message);
  }

  private async changeSkillLevel(chatId: number, level: number) {
    const session = this.activeSessions.get(chatId);
    if (session) {
      session.skillLevel = level;
      await this.bot.sendMessage(chatId, `⚙️ Niveau de difficulté changé à ${level}/20`);
    }
  }

  // Admin functions
  async broadcastMessage(message: string, filters?: any): Promise<void> {
    try {
      const users = await storage.getAllUsers();
      
      for (const user of users) {
        if (user.telegramId && user.isActive) {
          try {
            await this.bot.sendMessage(parseInt(user.telegramId), message, {
              parse_mode: 'Markdown'
            });
          } catch (error) {
            console.error(`Failed to send message to user ${user.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error in broadcastMessage:', error);
    }
  }

  async getActiveSessions(): Promise<GameSession[]> {
    return Array.from(this.activeSessions.values());
  }

  async getBotStats(): Promise<any> {
    const totalUsers = await storage.getAllUsers();
    const activeGames = this.activeSessions.size;
    
    return {
      totalUsers: totalUsers.length,
      activeUsers: totalUsers.filter(u => u.isActive).length,
      activeGames,
      activeSessions: this.activeSessions.size,
    };
  }
}

// Initialize bot if token is available
let chessBot: ChessBot | null = null;

if (process.env.TELEGRAM_BOT_TOKEN) {
  chessBot = new ChessBot(process.env.TELEGRAM_BOT_TOKEN);
  console.log('✅ Telegram Chess Bot initialized');
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not provided, bot will not start');
}

export { chessBot };
