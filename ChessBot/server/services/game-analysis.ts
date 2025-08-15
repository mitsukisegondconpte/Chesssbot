import { chessEngine, GameAnalysis } from './chess-engine';
import { storage } from '../storage';

export interface MoveAnalysis {
  moveNumber: number;
  move: string;
  evaluation: number;
  bestMove: string;
  classification: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  evaluationChange: number;
  timeSpent?: number;
}

export interface PositionAnalysis {
  fen: string;
  evaluation: number;
  bestMoves: Array<{
    move: string;
    evaluation: number;
    san: string;
  }>;
  threats: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface GameInsights {
  openingName?: string;
  openingECO?: string;
  gamePhases: {
    opening: { moves: number; avgAccuracy: number };
    middlegame: { moves: number; avgAccuracy: number };
    endgame: { moves: number; avgAccuracy: number };
  };
  timeManagement: {
    avgTimePerMove: number;
    timeInTrouble: boolean;
    rushingMoves: number[];
  };
  tacticalThemes: string[];
  improvementAreas: string[];
}

export interface DetailedGameAnalysis extends GameAnalysis {
  moveAnalyses: MoveAnalysis[];
  insights: GameInsights;
  playerAccuracies: {
    white: number;
    black: number;
  };
  criticalMoments: Array<{
    moveNumber: number;
    description: string;
    evaluation: number;
  }>;
}

export class GameAnalysisService {
  
  /**
   * Perform comprehensive game analysis
   */
  async analyzeGame(gameId: string, depth: number = 15): Promise<DetailedGameAnalysis> {
    try {
      const game = await storage.getGame(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      const moves = game.moveHistory as string[] || [];
      const initialFen = game.boardState || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      // Perform basic engine analysis
      const basicAnalysis = await chessEngine.analyzeGame(moves, initialFen);

      // Perform detailed move-by-move analysis
      const moveAnalyses = await this.analyzeMoves(moves, initialFen, depth);

      // Generate game insights
      const insights = await this.generateGameInsights(moves, moveAnalyses);

      // Calculate player accuracies
      const playerAccuracies = this.calculatePlayerAccuracies(moveAnalyses);

      // Identify critical moments
      const criticalMoments = this.identifyCriticalMoments(moveAnalyses);

      const detailedAnalysis: DetailedGameAnalysis = {
        ...basicAnalysis,
        moveAnalyses,
        insights,
        playerAccuracies,
        criticalMoments,
      };

      // Store analysis in database
      await storage.createGameAnalysis({
        gameId,
        accuracy: (playerAccuracies.white + playerAccuracies.black) / 2,
        blunders: basicAnalysis.blunders,
        mistakes: basicAnalysis.mistakes,
        inaccuracies: basicAnalysis.inaccuracies,
        suggestions: insights.improvementAreas,
        analysisData: detailedAnalysis,
      });

      return detailedAnalysis;

    } catch (error) {
      console.error('Error analyzing game:', error);
      throw error;
    }
  }

  /**
   * Analyze individual moves in detail
   */
  private async analyzeMoves(moves: string[], initialFen: string, depth: number): Promise<MoveAnalysis[]> {
    const analyses: MoveAnalysis[] = [];
    let currentFen = initialFen;
    let previousEvaluation = 0;

    for (let i = 0; i < moves.length; i++) {
      try {
        // Get best move for current position
        const bestMove = await chessEngine.getBestMove(currentFen, depth);
        const bestEvaluation = await chessEngine.evaluatePosition(currentFen, depth);

        // Apply the actual move played
        const actualMove = moves[i];
        const nextFen = this.applyMoveToFen(currentFen, actualMove);
        const actualEvaluation = await chessEngine.evaluatePosition(nextFen, depth);

        // Calculate evaluation change
        const evaluationChange = Math.abs(actualEvaluation - bestEvaluation);

        // Classify the move
        const classification = this.classifyMove(evaluationChange);

        analyses.push({
          moveNumber: Math.floor(i / 2) + 1,
          move: actualMove,
          evaluation: actualEvaluation,
          bestMove: bestMove.uci,
          classification,
          evaluationChange,
        });

        currentFen = nextFen;
        previousEvaluation = actualEvaluation;

      } catch (error) {
        console.error(`Error analyzing move ${i + 1}:`, error);
        // Add placeholder analysis for failed moves
        analyses.push({
          moveNumber: Math.floor(i / 2) + 1,
          move: moves[i],
          evaluation: 0,
          bestMove: '',
          classification: 'good',
          evaluationChange: 0,
        });
      }
    }

    return analyses;
  }

  /**
   * Generate comprehensive game insights
   */
  private async generateGameInsights(moves: string[], moveAnalyses: MoveAnalysis[]): Promise<GameInsights> {
    // Detect opening
    const opening = await this.detectOpening(moves);

    // Analyze game phases
    const gamePhases = this.analyzeGamePhases(moveAnalyses);

    // Analyze time management (simplified - would need actual time data)
    const timeManagement = {
      avgTimePerMove: 30, // Placeholder
      timeInTrouble: false,
      rushingMoves: [],
    };

    // Identify tactical themes
    const tacticalThemes = this.identifyTacticalThemes(moveAnalyses);

    // Generate improvement suggestions
    const improvementAreas = this.generateImprovementSuggestions(moveAnalyses, gamePhases);

    return {
      openingName: opening.name,
      openingECO: opening.eco,
      gamePhases,
      timeManagement,
      tacticalThemes,
      improvementAreas,
    };
  }

  /**
   * Detect chess opening from moves
   */
  private async detectOpening(moves: string[]): Promise<{ name?: string; eco?: string }> {
    // Simplified opening detection
    // In a real implementation, this would use an opening database
    const firstMoves = moves.slice(0, 10).join(' ');

    if (firstMoves.includes('e2e4')) {
      if (firstMoves.includes('e7e5')) {
        return { name: 'Partie du Roi', eco: 'C20' };
      } else if (firstMoves.includes('c7c5')) {
        return { name: 'Défense Sicilienne', eco: 'B20' };
      }
      return { name: 'Ouverture du Pion Roi', eco: 'B00' };
    } else if (firstMoves.includes('d2d4')) {
      return { name: 'Partie de la Dame', eco: 'D00' };
    }

    return { name: 'Ouverture irrégulière' };
  }

  /**
   * Analyze different phases of the game
   */
  private analyzeGamePhases(moveAnalyses: MoveAnalysis[]): GameInsights['gamePhases'] {
    const totalMoves = moveAnalyses.length;
    
    // Rough phase boundaries
    const openingEnd = Math.min(20, Math.floor(totalMoves * 0.3));
    const middlegameEnd = Math.min(40, Math.floor(totalMoves * 0.7));

    const opening = moveAnalyses.slice(0, openingEnd);
    const middlegame = moveAnalyses.slice(openingEnd, middlegameEnd);
    const endgame = moveAnalyses.slice(middlegameEnd);

    return {
      opening: {
        moves: opening.length,
        avgAccuracy: this.calculatePhaseAccuracy(opening),
      },
      middlegame: {
        moves: middlegame.length,
        avgAccuracy: this.calculatePhaseAccuracy(middlegame),
      },
      endgame: {
        moves: endgame.length,
        avgAccuracy: this.calculatePhaseAccuracy(endgame),
      },
    };
  }

  /**
   * Calculate accuracy for a game phase
   */
  private calculatePhaseAccuracy(moves: MoveAnalysis[]): number {
    if (moves.length === 0) return 0;

    const accuracySum = moves.reduce((sum, move) => {
      switch (move.classification) {
        case 'excellent': return sum + 100;
        case 'good': return sum + 85;
        case 'inaccuracy': return sum + 70;
        case 'mistake': return sum + 40;
        case 'blunder': return sum + 10;
        default: return sum + 75;
      }
    }, 0);

    return accuracySum / moves.length;
  }

  /**
   * Identify tactical themes in the game
   */
  private identifyTacticalThemes(moveAnalyses: MoveAnalysis[]): string[] {
    const themes: string[] = [];

    // Look for patterns in evaluation changes
    const largeSwings = moveAnalyses.filter(move => move.evaluationChange > 2);
    if (largeSwings.length > 2) {
      themes.push('Tactiques complexes');
    }

    const blunders = moveAnalyses.filter(move => move.classification === 'blunder');
    if (blunders.length > 0) {
      themes.push('Erreurs tactiques');
    }

    const excellentMoves = moveAnalyses.filter(move => move.classification === 'excellent');
    if (excellentMoves.length > 5) {
      themes.push('Jeu précis');
    }

    return themes.length > 0 ? themes : ['Partie positionnelle'];
  }

  /**
   * Generate improvement suggestions based on analysis
   */
  private generateImprovementSuggestions(
    moveAnalyses: MoveAnalysis[],
    gamePhases: GameInsights['gamePhases']
  ): string[] {
    const suggestions: string[] = [];

    // Opening suggestions
    if (gamePhases.opening.avgAccuracy < 80) {
      suggestions.push('Étudier les principes d\'ouverture');
      suggestions.push('Développer les pièces plus rapidement');
    }

    // Middlegame suggestions
    if (gamePhases.middlegame.avgAccuracy < 75) {
      suggestions.push('Améliorer la vision tactique');
      suggestions.push('Calculer plus profondément les variantes');
    }

    // Endgame suggestions
    if (gamePhases.endgame.avgAccuracy < 70) {
      suggestions.push('Étudier les finales de base');
      suggestions.push('Améliorer la technique en finale');
    }

    // Tactical suggestions
    const blunderCount = moveAnalyses.filter(m => m.classification === 'blunder').length;
    if (blunderCount > 2) {
      suggestions.push('Prendre plus de temps pour vérifier les coups');
      suggestions.push('Résoudre des exercices tactiques');
    }

    const mistakeCount = moveAnalyses.filter(m => m.classification === 'mistake').length;
    if (mistakeCount > 3) {
      suggestions.push('Analyser les positions critiques');
      suggestions.push('Améliorer l\'évaluation positionnelle');
    }

    return suggestions.length > 0 ? suggestions : ['Continuer à pratiquer régulièrement'];
  }

  /**
   * Calculate player-specific accuracies
   */
  private calculatePlayerAccuracies(moveAnalyses: MoveAnalysis[]): { white: number; black: number } {
    const whiteMoves = moveAnalyses.filter((_, index) => index % 2 === 0);
    const blackMoves = moveAnalyses.filter((_, index) => index % 2 === 1);

    return {
      white: this.calculatePhaseAccuracy(whiteMoves),
      black: this.calculatePhaseAccuracy(blackMoves),
    };
  }

  /**
   * Identify critical moments in the game
   */
  private identifyCriticalMoments(moveAnalyses: MoveAnalysis[]): Array<{
    moveNumber: number;
    description: string;
    evaluation: number;
  }> {
    const criticalMoments = [];

    for (let i = 1; i < moveAnalyses.length; i++) {
      const move = moveAnalyses[i];
      const prevMove = moveAnalyses[i - 1];

      // Large evaluation swings
      const evaluationDiff = Math.abs(move.evaluation - prevMove.evaluation);
      if (evaluationDiff > 3) {
        criticalMoments.push({
          moveNumber: move.moveNumber,
          description: `Moment critique: changement d'évaluation de ${evaluationDiff.toFixed(1)} points`,
          evaluation: move.evaluation,
        });
      }

      // Blunders
      if (move.classification === 'blunder') {
        criticalMoments.push({
          moveNumber: move.moveNumber,
          description: 'Bourde majeure commise',
          evaluation: move.evaluation,
        });
      }

      // Game-changing mistakes
      if (move.classification === 'mistake' && evaluationDiff > 2) {
        criticalMoments.push({
          moveNumber: move.moveNumber,
          description: 'Erreur coûteuse',
          evaluation: move.evaluation,
        });
      }
    }

    return criticalMoments.sort((a, b) => b.moveNumber - a.moveNumber).slice(0, 5);
  }

  /**
   * Classify move quality based on evaluation loss
   */
  private classifyMove(evaluationChange: number): 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' {
    if (evaluationChange >= 3.0) return 'blunder';
    if (evaluationChange >= 1.5) return 'mistake';
    if (evaluationChange >= 0.5) return 'inaccuracy';
    if (evaluationChange <= 0.1) return 'excellent';
    return 'good';
  }

  /**
   * Apply a move to a FEN string (simplified)
   */
  private applyMoveToFen(fen: string, move: string): string {
    // This is a simplified implementation
    // In a real app, you'd use chess.js or similar library
    return fen;
  }

  /**
   * Analyze a specific position
   */
  async analyzePosition(fen: string, depth: number = 15): Promise<PositionAnalysis> {
    try {
      const evaluation = await chessEngine.evaluatePosition(fen, depth);
      const bestMove = await chessEngine.getBestMove(fen, depth);

      // Generate multiple best moves
      const bestMoves = [
        {
          move: bestMove.uci,
          evaluation,
          san: bestMove.san,
        }
      ];

      // Generate basic position assessment
      const threats = this.assessThreats(fen);
      const weaknesses = this.assessWeaknesses(fen);
      const suggestions = this.generatePositionSuggestions(evaluation, threats, weaknesses);

      return {
        fen,
        evaluation,
        bestMoves,
        threats,
        weaknesses,
        suggestions,
      };

    } catch (error) {
      console.error('Error analyzing position:', error);
      throw error;
    }
  }

  /**
   * Generate training exercises based on common mistakes
   */
  async generateTrainingExercises(userId: string): Promise<Array<{
    type: string;
    description: string;
    fen: string;
    solution: string;
  }>> {
    try {
      // Get user's recent games
      const userGames = await storage.getGamesByUser(userId, 10);
      const exercises = [];

      // Analyze recent games to find patterns
      for (const game of userGames) {
        const analysis = await storage.getGameAnalysis(game.id);
        if (analysis?.analysisData) {
          const data = analysis.analysisData as DetailedGameAnalysis;
          
          // Create exercises based on identified weaknesses
          for (const area of data.insights.improvementAreas) {
            exercises.push({
              type: 'tactical',
              description: `Améliorer: ${area}`,
              fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              solution: 'Exercice personnalisé basé sur vos parties',
            });
          }
        }
      }

      return exercises.slice(0, 5); // Return top 5 exercises

    } catch (error) {
      console.error('Error generating training exercises:', error);
      return [];
    }
  }

  private assessThreats(fen: string): string[] {
    // Simplified threat assessment
    return ['Menaces tactiques possibles'];
  }

  private assessWeaknesses(fen: string): string[] {
    // Simplified weakness assessment
    return ['Faiblesses positionnelles possibles'];
  }

  private generatePositionSuggestions(
    evaluation: number,
    threats: string[],
    weaknesses: string[]
  ): string[] {
    const suggestions = [];

    if (evaluation > 2) {
      suggestions.push('Position gagnante - chercher le gain de matériel');
    } else if (evaluation > 0.5) {
      suggestions.push('Léger avantage - maintenir la pression');
    } else if (evaluation < -2) {
      suggestions.push('Position difficile - chercher des complications');
    } else if (evaluation < -0.5) {
      suggestions.push('Légèrement désavantagé - chercher l\'égalité');
    } else {
      suggestions.push('Position équilibrée - chercher l\'initiative');
    }

    return suggestions;
  }
}

export const gameAnalysisService = new GameAnalysisService();
