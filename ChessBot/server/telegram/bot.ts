import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { chessEngine } from '../services/chess-engine';
import { calculateEloChange } from '../services/elo-calculator';
import { notificationService } from '../services/notification';
import { 
  createStartKeyboard, 
  createMoveKeyboard, 
  createGameOverKeyboard,
  createSettingsKeyboard 
} from './keyboards';
import { 
  handleStartCommand,
  handleNewGameCommand,
  handleStatsCommand,
  handleHelpCommand,
  handleCallbackQuery 
} from './handlers';
import { formatGameMessage, formatStatsMessage } from './utils';

export interface TelegramGameSession {
  chatId: number;
  userId: string;
  gameId: string;
  boardState: string;
  isPlayerTurn: boolean;
  skillLevel: number;
  gameStarted: Date;
}

export class ChessTelegramBot {
  private bot: TelegramBot;
  private activeSessions: Map<number, TelegramGameSession> = new Map();
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers() {
    // Command handlers
    this.bot.onText(/\/start/, (msg) => handleStartCommand(msg, this));
    this.bot.onText(/\/new/, (msg) => handleNewGameCommand(msg, this));
    this.bot.onText(/\/stats/, (msg) => handleStatsCommand(msg, this));
    this.bot.onText(/\/help/, (msg) => handleHelpCommand(msg, this));
    this.bot.onText(/\/settings/, (msg) => this.handleSettingsCommand(msg));
    this.bot.onText(/\/ranking/, (msg) => this.handleRankingCommand(msg));

    // Callback query handler
    this.bot.on('callback_query', (query) => handleCallbackQuery(query, this));

    // Message handler for move notation
    this.bot.on('message', (msg) => this.handleMessage(msg));
  }

  private setupErrorHandling() {
    this.bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });

    this.bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception in Telegram bot:', error);
    });
  }

  private async handleMessage(msg: TelegramBot.Message) {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const session = this.activeSessions.get(chatId);

    if (session && this.isValidMoveNotation(msg.text)) {
      await this.handleMoveInput(chatId, msg.text);
    }
  }

  private isValidMoveNotation(text: string): boolean {
    // Check if text looks like chess move notation (e4, Nf3, O-O, etc.)
    const movePattern = /^[a-h][1-8]$|^[NBRQK][a-h]?[1-8]?x?[a-h][1-8]$|^O-O(-O)?$|^[a-h]x[a-h][1-8]$/;
    return movePattern.test(text.trim());
  }

  private async handleMoveInput(chatId: number, moveText: string) {
    const session = this.activeSessions.get(chatId);
    if (!session || !session.isPlayerTurn) return;

    try {
      // Convert algebraic notation to UCI if needed
      const uciMove = await this.convertToUCI(session.boardState, moveText);
      await this.processPlayerMove(chatId, uciMove);
    } catch (error) {
      await this.sendMessage(chatId, '❌ Coup invalide. Utilisez la notation algébrique (ex: e4, Nf3)');
    }
  }

  private async convertToUCI(fen: string, san: string): Promise<string> {
    // Implementation would convert SAN to UCI using chess.js or similar
    // For now, return as-is assuming UCI format
    return san;
  }

  async createNewGame(chatId: number, userId: string): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        await this.sendMessage(chatId, '❌ Utilisateur non trouvé. Utilisez /start pour vous enregistrer.');
        return;
      }

      // Create game in database
      const game = await storage.createGame({
        whitePlayerId: userId,
        blackPlayerId: null, // Playing against engine
        status: 'active',
        boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moveHistory: [],
        isRated: true,
      });

      // Create session
      const session: TelegramGameSession = {
        chatId,
        userId,
        gameId: game.id,
        boardState: game.boardState!,
        isPlayerTurn: true,
        skillLevel: 5,
        gameStarted: new Date(),
      };

      this.activeSessions.set(chatId, session);

      // Send initial board and moves
      await this.sendGameState(chatId);

      // Notify game start
      await notificationService.notifyGameStart(game.id);

    } catch (error) {
      console.error('Error creating new game:', error);
      await this.sendMessage(chatId, '❌ Erreur lors de la création de la partie.');
    }
  }

  async processPlayerMove(chatId: number, move: string): Promise<void> {
    const session = this.activeSessions.get(chatId);
    if (!session || !session.isPlayerTurn) return;

    try {
      // Validate move
      const isValid = await chessEngine.validateMove(session.boardState, move);
      if (!isValid) {
        await this.sendMessage(chatId, '❌ Coup illégal !');
        return;
      }

      // Apply move
      const newBoardState = await this.applyMove(session.boardState, move);
      session.boardState = newBoardState;
      session.isPlayerTurn = false;

      // Update game in database
      const currentMoves = await this.getCurrentMoves(session.gameId);
      currentMoves.push(move);
      
      await storage.updateGame(session.gameId, {
        boardState: newBoardState,
        moveHistory: currentMoves,
      });

      // Check if game is over
      const gameResult = await this.checkGameOver(newBoardState);
      if (gameResult) {
        await this.endGame(chatId, gameResult);
        return;
      }

      // Get AI move
      const config = chessEngine.getEngineConfig(session.skillLevel);
      const aiMove = await chessEngine.getBestMove(newBoardState, config.depth, config.time);
      
      // Apply AI move
      const finalBoardState = await this.applyMove(newBoardState, aiMove.uci);
      session.boardState = finalBoardState;
      session.isPlayerTurn = true;

      // Update game with AI move
      currentMoves.push(aiMove.uci);
      await storage.updateGame(session.gameId, {
        boardState: finalBoardState,
        moveHistory: currentMoves,
      });

      // Check game over again
      const finalResult = await this.checkGameOver(finalBoardState);
      if (finalResult) {
        await this.endGame(chatId, finalResult);
        return;
      }

      // Send updated game state
      await this.sendGameState(chatId, `Votre coup: ${move}\nCoup de l'IA: ${aiMove.san || aiMove.uci}`);

    } catch (error) {
      console.error('Error processing move:', error);
      await this.sendMessage(chatId, '❌ Erreur lors du traitement du coup.');
    }
  }

  private async sendGameState(chatId: number, message?: string): Promise<void> {
    const session = this.activeSessions.get(chatId);
    if (!session) return;

    try {
      // Generate board image (simplified - would use actual chess board renderer)
      const boardText = this.generateBoardText(session.boardState);
      
      const status = session.isPlayerTurn ? '🟢 À votre tour' : '🔴 Tour de l\'IA';
      const gameMessage = message ? `${message}\n\n${status}` : status;

      const fullMessage = `♟️ **Partie en cours**\n\n${boardText}\n\n${gameMessage}`;

      // Get available moves for keyboard
      const availableMoves = await this.getAvailableMoves(session.boardState);
      const keyboard = createMoveKeyboard(availableMoves, session.gameId);

      await this.sendMessage(chatId, fullMessage, {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
      });

    } catch (error) {
      console.error('Error sending game state:', error);
    }
  }

  private generateBoardText(fen: string): string {
    // Simplified board representation
    // In a real implementation, this would generate a visual board or use an image
    const pieces = fen.split(' ')[0];
    const ranks = pieces.split('/');
    
    let board = '```\n  a b c d e f g h\n';
    for (let i = 0; i < 8; i++) {
      let rank = `${8 - i} `;
      const rankStr = ranks[i];
      
      for (const char of rankStr) {
        if (isNaN(parseInt(char))) {
          rank += `${char} `;
        } else {
          rank += '. '.repeat(parseInt(char));
        }
      }
      board += rank + `${8 - i}\n`;
    }
    board += '  a b c d e f g h\n```';
    
    return board;
  }

  private async getAvailableMoves(fen: string): Promise<string[]> {
    // Implementation would get legal moves from the position
    // For now, return common moves
    return ['e2e4', 'e2e3', 'd2d4', 'd2d3', 'g1f3', 'b1c3'];
  }

  private async applyMove(fen: string, move: string): Promise<string> {
    // Implementation would apply move to FEN using chess.js
    // For now, return modified FEN (placeholder)
    return fen;
  }

  private async getCurrentMoves(gameId: string): Promise<string[]> {
    const game = await storage.getGame(gameId);
    return (game?.moveHistory as string[]) || [];
  }

  private async checkGameOver(fen: string): Promise<string | null> {
    // Implementation would check for checkmate, stalemate, etc.
    return null;
  }

  private async endGame(chatId: number, result: string): Promise<void> {
    const session = this.activeSessions.get(chatId);
    if (!session) return;

    try {
      // Update game in database
      await storage.updateGame(session.gameId, {
        status: 'completed',
        result: result as any,
        completedAt: new Date(),
      });

      // Calculate ELO changes
      const user = await storage.getUser(session.userId);
      if (user) {
        const eloChange = calculateEloChange(user.eloRating, 1500, result); // AI rating 1500
        const newRating = user.eloRating + eloChange;

        await storage.updateUser(session.userId, {
          eloRating: newRating,
          gamesPlayed: user.gamesPlayed + 1,
          gamesWon: result === 'white_wins' ? user.gamesWon + 1 : user.gamesWon,
          gamesLost: result === 'black_wins' ? user.gamesLost + 1 : user.gamesLost,
          gamesDrawn: result === 'draw' ? user.gamesDrawn + 1 : user.gamesDrawn,
        });

        // Notify ELO change
        await notificationService.notifyEloChange(session.userId, user.eloRating, newRating, eloChange);
      }

      // Remove session
      this.activeSessions.delete(chatId);

      // Send game over message
      let resultMessage = '';
      switch (result) {
        case 'white_wins':
          resultMessage = '🏆 Félicitations ! Vous avez gagné !';
          break;
        case 'black_wins':
          resultMessage = '😔 L\'IA a gagné cette fois.';
          break;
        case 'draw':
          resultMessage = '🤝 Match nul !';
          break;
      }

      const endMessage = `🏁 **Partie Terminée**\n\n${resultMessage}`;
      const keyboard = createGameOverKeyboard();

      await this.sendMessage(chatId, endMessage, {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
      });

      // Notify game end
      await notificationService.notifyGameEnd(session.gameId, result);

    } catch (error) {
      console.error('Error ending game:', error);
    }
  }

  private async handleSettingsCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const session = this.activeSessions.get(chatId);

    const settingsMessage = `⚙️ **Paramètres**\n\nNiveau IA actuel: ${session?.skillLevel || 5}/20`;
    const keyboard = createSettingsKeyboard();

    await this.sendMessage(chatId, settingsMessage, {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  }

  private async handleRankingCommand(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const topPlayers = await storage.getTopPlayers(10);
      
      let rankingMessage = '🏆 **Classement des Meilleurs Joueurs**\n\n';
      
      topPlayers.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const name = player.nickname || player.username;
        rankingMessage += `${medal} ${name} - ${player.eloRating} ELO (${player.gamesWon}V)\n`;
      });

      const keyboard = createStartKeyboard();

      await this.sendMessage(chatId, rankingMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });

    } catch (error) {
      console.error('Error showing ranking:', error);
      await this.sendMessage(chatId, '❌ Erreur lors de l\'affichage du classement.');
    }
  }

  async updateSkillLevel(chatId: number, level: number): Promise<void> {
    const session = this.activeSessions.get(chatId);
    if (session) {
      session.skillLevel = level;
      await this.sendMessage(chatId, `⚙️ Niveau de difficulté mis à jour: ${level}/20`);
    }
  }

  async sendMessage(
    chatId: number, 
    message: string, 
    options?: TelegramBot.SendMessageOptions
  ): Promise<TelegramBot.Message> {
    try {
      return await this.bot.sendMessage(chatId, message, options);
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      throw error;
    }
  }

  async broadcastMessage(message: string, filters?: any): Promise<void> {
    try {
      const users = await storage.getAllUsers();
      
      for (const user of users) {
        if (user.telegramId && user.isActive) {
          try {
            await this.sendMessage(parseInt(user.telegramId), message, {
              parse_mode: 'Markdown'
            });
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 50));
            
          } catch (error) {
            console.error(`Failed to send message to user ${user.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error broadcasting message:', error);
      throw error;
    }
  }

  getActiveSessions(): TelegramGameSession[] {
    return Array.from(this.activeSessions.values());
  }

  getSessionByUserId(userId: string): TelegramGameSession | undefined {
    return Array.from(this.activeSessions.values()).find(session => session.userId === userId);
  }

  async getBotStats(): Promise<any> {
    const totalUsers = await storage.getAllUsers();
    const activeGames = this.activeSessions.size;
    
    return {
      totalUsers: totalUsers.length,
      activeUsers: totalUsers.filter(u => u.isActive).length,
      activeGames,
      activeSessions: this.activeSessions.size,
      uptime: process.uptime(),
    };
  }

  // Getter for the bot instance (for external access if needed)
  get botInstance(): TelegramBot {
    return this.bot;
  }
}

// Initialize bot if token is available
let chessTelegramBot: ChessTelegramBot | null = null;

if (process.env.TELEGRAM_BOT_TOKEN) {
  chessTelegramBot = new ChessTelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  console.log('✅ Telegram Chess Bot initialized');
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not provided, bot will not start');
}

export { chessTelegramBot };
