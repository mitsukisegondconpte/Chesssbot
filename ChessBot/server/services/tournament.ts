import { storage } from '../storage';
import { calculateEloChange } from './elo-calculator';
import { chessBot } from './telegram-bot';

export interface TournamentRound {
  roundNumber: number;
  matches: TournamentMatch[];
  isComplete: boolean;
}

export interface TournamentMatch {
  id: string;
  player1Id: string;
  player2Id: string;
  gameId?: string;
  result?: 'player1_wins' | 'player2_wins' | 'draw';
  isComplete: boolean;
}

export interface TournamentSettings {
  maxParticipants: number;
  timeControl: string;
  isRated: boolean;
  prizePool?: string;
  autoStart: boolean;
  autoAdvance: boolean;
  eliminationFormat: 'single' | 'double' | 'swiss' | 'round_robin';
}

export class TournamentService {
  
  /**
   * Create a new tournament
   */
  async createTournament(
    name: string,
    description: string,
    settings: TournamentSettings,
    createdBy: string,
    startTime?: Date
  ) {
    try {
      const tournament = await storage.createTournament({
        name,
        description,
        maxParticipants: settings.maxParticipants,
        isAutomated: settings.autoStart,
        startTime,
        rules: settings,
        createdBy,
      });

      // If auto-start is enabled and start time is in the past or immediate
      if (settings.autoStart && (!startTime || startTime <= new Date())) {
        await this.scheduleTournamentStart(tournament.id);
      }

      return tournament;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw new Error('Failed to create tournament');
    }
  }

  /**
   * Join a tournament
   */
  async joinTournament(tournamentId: string, userId: string) {
    try {
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (tournament.status !== 'upcoming') {
        throw new Error('Tournament is not accepting registrations');
      }

      if (tournament.currentParticipants >= tournament.maxParticipants) {
        throw new Error('Tournament is full');
      }

      await storage.joinTournament(tournamentId, userId);

      // Check if tournament should auto-start
      const updatedTournament = await storage.getTournament(tournamentId);
      if (updatedTournament?.isAutomated && 
          updatedTournament.currentParticipants >= updatedTournament.maxParticipants) {
        await this.startTournament(tournamentId);
      }

      return true;
    } catch (error) {
      console.error('Error joining tournament:', error);
      throw error;
    }
  }

  /**
   * Start a tournament
   */
  async startTournament(tournamentId: string) {
    try {
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (tournament.status !== 'upcoming') {
        throw new Error('Tournament already started or completed');
      }

      // Get participants
      const participants = await this.getTournamentParticipants(tournamentId);
      if (participants.length < 2) {
        throw new Error('Not enough participants to start tournament');
      }

      // Update tournament status
      await storage.updateTournament(tournamentId, {
        status: 'active',
        startTime: new Date(),
      });

      // Generate first round matches
      await this.generateRound(tournamentId, participants);

      // Notify participants
      await this.notifyTournamentStart(tournamentId, participants);

      return true;
    } catch (error) {
      console.error('Error starting tournament:', error);
      throw error;
    }
  }

  /**
   * Generate tournament rounds based on format
   */
  private async generateRound(tournamentId: string, participants: any[]) {
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament?.rules) return;

    const settings = tournament.rules as TournamentSettings;

    switch (settings.eliminationFormat) {
      case 'single':
        await this.generateSingleEliminationRound(tournamentId, participants);
        break;
      case 'double':
        await this.generateDoubleEliminationRound(tournamentId, participants);
        break;
      case 'swiss':
        await this.generateSwissRound(tournamentId, participants);
        break;
      case 'round_robin':
        await this.generateRoundRobinRound(tournamentId, participants);
        break;
      default:
        await this.generateSingleEliminationRound(tournamentId, participants);
    }
  }

  private async generateSingleEliminationRound(tournamentId: string, participants: any[]) {
    // Shuffle participants for random pairing
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    
    const matches: TournamentMatch[] = [];
    
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        // Create game for this match
        const game = await storage.createGame({
          whitePlayerId: shuffled[i].userId,
          blackPlayerId: shuffled[i + 1].userId,
          status: 'active',
          tournamentId,
          isRated: true,
          boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moveHistory: [],
        });

        matches.push({
          id: `match_${i/2 + 1}`,
          player1Id: shuffled[i].userId,
          player2Id: shuffled[i + 1].userId,
          gameId: game.id,
          isComplete: false,
        });
      } else {
        // Bye - player advances automatically
        // In a real implementation, this would be handled properly
      }
    }

    // Store round information (would need separate rounds table in real implementation)
    console.log(`Generated ${matches.length} matches for tournament ${tournamentId}`);
  }

  private async generateDoubleEliminationRound(tournamentId: string, participants: any[]) {
    // Double elimination logic - more complex bracket system
    // Implementation would require winners and losers brackets
    await this.generateSingleEliminationRound(tournamentId, participants);
  }

  private async generateSwissRound(tournamentId: string, participants: any[]) {
    // Swiss system - pair players with similar scores
    // Implementation would require score tracking across rounds
    await this.generateSingleEliminationRound(tournamentId, participants);
  }

  private async generateRoundRobinRound(tournamentId: string, participants: any[]) {
    // Round robin - everyone plays everyone
    const matches: TournamentMatch[] = [];
    
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const game = await storage.createGame({
          whitePlayerId: participants[i].userId,
          blackPlayerId: participants[j].userId,
          status: 'active',
          tournamentId,
          isRated: true,
          boardState: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moveHistory: [],
        });

        matches.push({
          id: `match_${i}_${j}`,
          player1Id: participants[i].userId,
          player2Id: participants[j].userId,
          gameId: game.id,
          isComplete: false,
        });
      }
    }

    console.log(`Generated ${matches.length} round-robin matches for tournament ${tournamentId}`);
  }

  /**
   * Handle game completion in tournament context
   */
  async handleGameCompletion(gameId: string, result: string) {
    try {
      const game = await storage.getGame(gameId);
      if (!game?.tournamentId) return;

      const tournament = await storage.getTournament(game.tournamentId);
      if (!tournament) return;

      // Update ELO ratings for tournament game
      if (game.whitePlayerId && game.blackPlayerId) {
        const whitePlayer = await storage.getUser(game.whitePlayerId);
        const blackPlayer = await storage.getUser(game.blackPlayerId);

        if (whitePlayer && blackPlayer) {
          const whiteEloChange = calculateEloChange(
            whitePlayer.eloRating,
            blackPlayer.eloRating,
            result
          );
          const blackEloChange = -whiteEloChange;

          await Promise.all([
            storage.updateUser(whitePlayer.id, {
              eloRating: whitePlayer.eloRating + whiteEloChange,
              gamesPlayed: whitePlayer.gamesPlayed + 1,
              gamesWon: result === 'white_wins' ? whitePlayer.gamesWon + 1 : whitePlayer.gamesWon,
              gamesLost: result === 'black_wins' ? whitePlayer.gamesLost + 1 : whitePlayer.gamesLost,
              gamesDrawn: result === 'draw' ? whitePlayer.gamesDrawn + 1 : whitePlayer.gamesDrawn,
            }),
            storage.updateUser(blackPlayer.id, {
              eloRating: blackPlayer.eloRating + blackEloChange,
              gamesPlayed: blackPlayer.gamesPlayed + 1,
              gamesWon: result === 'black_wins' ? blackPlayer.gamesWon + 1 : blackPlayer.gamesWon,
              gamesLost: result === 'white_wins' ? blackPlayer.gamesLost + 1 : blackPlayer.gamesLost,
              gamesDrawn: result === 'draw' ? blackPlayer.gamesDrawn + 1 : blackPlayer.gamesDrawn,
            }),
            storage.updateGame(gameId, {
              whiteEloChange,
              blackEloChange,
            }),
          ]);
        }
      }

      // Check if tournament round is complete
      await this.checkRoundCompletion(game.tournamentId);

    } catch (error) {
      console.error('Error handling tournament game completion:', error);
    }
  }

  /**
   * Check if current tournament round is complete and advance if needed
   */
  private async checkRoundCompletion(tournamentId: string) {
    try {
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament || tournament.status !== 'active') return;

      // Get all active games for this tournament
      const activeGames = await this.getTournamentActiveGames(tournamentId);
      
      if (activeGames.length === 0) {
        // Round is complete, check if tournament is finished
        const participants = await this.getTournamentParticipants(tournamentId);
        const remainingPlayers = await this.getRemainingPlayers(tournamentId);

        if (remainingPlayers.length <= 1) {
          // Tournament is complete
          await this.completeTournament(tournamentId, remainingPlayers[0]?.userId);
        } else {
          // Generate next round
          await this.generateRound(tournamentId, remainingPlayers);
        }
      }

    } catch (error) {
      console.error('Error checking round completion:', error);
    }
  }

  /**
   * Complete a tournament
   */
  private async completeTournament(tournamentId: string, winnerId?: string) {
    try {
      await storage.updateTournament(tournamentId, {
        status: 'completed',
        endTime: new Date(),
        winnerId,
      });

      // Notify participants of tournament completion
      await this.notifyTournamentCompletion(tournamentId, winnerId);

      console.log(`Tournament ${tournamentId} completed. Winner: ${winnerId || 'None'}`);

    } catch (error) {
      console.error('Error completing tournament:', error);
    }
  }

  /**
   * Schedule automated tournament creation
   */
  async scheduleAutomatedTournaments() {
    // Daily tournament at 20:00
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 20 && now.getMinutes() === 0) {
        await this.createAutomatedTournament('daily');
      }
    }, 60000); // Check every minute

    // Weekly tournament on Sundays at 15:00
    setInterval(async () => {
      const now = new Date();
      if (now.getDay() === 0 && now.getHours() === 15 && now.getMinutes() === 0) {
        await this.createAutomatedTournament('weekly');
      }
    }, 60000);
  }

  private async createAutomatedTournament(type: 'daily' | 'weekly') {
    try {
      const settings: TournamentSettings = {
        maxParticipants: type === 'daily' ? 16 : 32,
        timeControl: '10+5',
        isRated: true,
        autoStart: true,
        autoAdvance: true,
        eliminationFormat: 'single',
      };

      const tournament = await this.createTournament(
        `Tournoi ${type === 'daily' ? 'Quotidien' : 'Hebdomadaire'}`,
        `Tournoi automatisé ${type === 'daily' ? 'du jour' : 'de la semaine'}`,
        settings,
        'system',
        new Date(Date.now() + 30 * 60 * 1000) // Start in 30 minutes
      );

      // Broadcast tournament announcement
      if (chessBot) {
        const message = `🏆 **Nouveau Tournoi ${type === 'daily' ? 'Quotidien' : 'Hebdomadaire'} !**

📅 Début dans 30 minutes
👥 ${settings.maxParticipants} participants maximum
⏰ Cadence : ${settings.timeControl}
🏆 Système à élimination directe

Rejoignez-nous pour une compétition passionnante !`;

        await chessBot.broadcastMessage(message);
      }

      console.log(`Created automated ${type} tournament: ${tournament.id}`);

    } catch (error) {
      console.error(`Error creating automated ${type} tournament:`, error);
    }
  }

  // Helper methods
  private async getTournamentParticipants(tournamentId: string) {
    // In a real implementation, this would query the tournament_participants table
    return [];
  }

  private async getTournamentActiveGames(tournamentId: string) {
    const activeGames = await storage.getActiveGames();
    return activeGames.filter(game => game.tournamentId === tournamentId);
  }

  private async getRemainingPlayers(tournamentId: string) {
    // Logic to determine which players are still in the tournament
    return [];
  }

  private async scheduleTournamentStart(tournamentId: string) {
    // Logic to schedule tournament start
    setTimeout(async () => {
      await this.startTournament(tournamentId);
    }, 30 * 60 * 1000); // Start in 30 minutes
  }

  private async notifyTournamentStart(tournamentId: string, participants: any[]) {
    if (chessBot) {
      const message = `🏁 **Tournoi Commencé !**

Le tournoi vient de commencer. Bonne chance à tous les participants !`;

      for (const participant of participants) {
        const user = await storage.getUser(participant.userId);
        if (user?.telegramId) {
          try {
            await chessBot.bot.sendMessage(parseInt(user.telegramId), message, {
              parse_mode: 'Markdown'
            });
          } catch (error) {
            console.error(`Failed to notify participant ${user.id}:`, error);
          }
        }
      }
    }
  }

  private async notifyTournamentCompletion(tournamentId: string, winnerId?: string) {
    if (chessBot && winnerId) {
      const winner = await storage.getUser(winnerId);
      const message = `🏆 **Tournoi Terminé !**

Félicitations à ${winner?.nickname || winner?.username || 'le gagnant'} pour cette victoire !`;

      await chessBot.broadcastMessage(message);
    }
  }
}

export const tournamentService = new TournamentService();

// Initialize automated tournaments if enabled
if (process.env.ENABLE_AUTOMATED_TOURNAMENTS === 'true') {
  tournamentService.scheduleAutomatedTournaments();
  console.log('✅ Automated tournaments scheduled');
}
