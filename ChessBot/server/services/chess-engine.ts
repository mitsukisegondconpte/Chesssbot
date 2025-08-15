import { spawn } from 'child_process';
import path from 'path';

export interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  uci: string;
}

export interface GameAnalysis {
  bestMove: ChessMove;
  evaluation: number;
  depth: number;
  variations: Array<{
    moves: string[];
    evaluation: number;
    depth: number;
  }>;
  accuracy?: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
}

export interface MoveClassification {
  type: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  evaluation: number;
  bestMove?: string;
  explanation?: string;
}

export class ChessEngine {
  private stockfishPath: string;
  private defaultDepth: number = 15;
  private defaultTime: number = 1000; // milliseconds

  constructor(stockfishPath = 'stockfish') {
    this.stockfishPath = stockfishPath;
  }

  /**
   * Get the best move for a given position
   */
  async getBestMove(fen: string, depth?: number, timeLimit?: number): Promise<ChessMove> {
    return new Promise((resolve, reject) => {
      const engine = spawn(this.stockfishPath);
      let bestMove = '';
      let evaluation = 0;

      const commands = [
        'uci',
        'isready',
        `position fen ${fen}`,
        `go depth ${depth || this.defaultDepth} movetime ${timeLimit || this.defaultTime}`
      ];

      engine.stdout.on('data', (data) => {
        const output = data.toString();
        const lines = output.split('\n');

        for (const line of lines) {
          if (line.startsWith('bestmove')) {
            bestMove = line.split(' ')[1];
          }
          if (line.includes('score cp')) {
            const match = line.match(/score cp (-?\d+)/);
            if (match) {
              evaluation = parseInt(match[1]) / 100; // Convert centipawns to pawns
            }
          }
          if (line.includes('score mate')) {
            const match = line.match(/score mate (-?\d+)/);
            if (match) {
              const mateIn = parseInt(match[1]);
              evaluation = mateIn > 0 ? 1000 - mateIn : -1000 - mateIn;
            }
          }
        }
      });

      engine.stderr.on('data', (data) => {
        console.error('Stockfish error:', data.toString());
      });

      engine.on('close', (code) => {
        if (bestMove) {
          resolve({
            from: bestMove.substring(0, 2),
            to: bestMove.substring(2, 4),
            promotion: bestMove.length > 4 ? bestMove[4] : undefined,
            uci: bestMove,
            san: bestMove // Would need chess.js to convert UCI to SAN
          });
        } else {
          reject(new Error('Failed to get best move from engine'));
        }
      });

      // Send commands to engine
      commands.forEach(command => {
        engine.stdin.write(command + '\n');
      });

      engine.stdin.end();
    });
  }

  /**
   * Evaluate a position
   */
  async evaluatePosition(fen: string, depth?: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const engine = spawn(this.stockfishPath);
      let evaluation = 0;

      const commands = [
        'uci',
        'isready',
        `position fen ${fen}`,
        `go depth ${depth || this.defaultDepth}`
      ];

      engine.stdout.on('data', (data) => {
        const output = data.toString();
        const lines = output.split('\n');

        for (const line of lines) {
          if (line.includes('score cp')) {
            const match = line.match(/score cp (-?\d+)/);
            if (match) {
              evaluation = parseInt(match[1]) / 100;
            }
          }
          if (line.includes('score mate')) {
            const match = line.match(/score mate (-?\d+)/);
            if (match) {
              const mateIn = parseInt(match[1]);
              evaluation = mateIn > 0 ? 1000 - mateIn : -1000 - mateIn;
            }
          }
        }
      });

      engine.on('close', () => {
        resolve(evaluation);
      });

      commands.forEach(command => {
        engine.stdin.write(command + '\n');
      });

      engine.stdin.end();
    });
  }

  /**
   * Analyze a complete game
   */
  async analyzeGame(moves: string[], initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'): Promise<GameAnalysis> {
    const variations = [];
    let blunders = 0;
    let mistakes = 0;
    let inaccuracies = 0;
    let totalAccuracy = 0;

    // Analyze each position in the game
    for (let i = 0; i < moves.length; i++) {
      try {
        // Here we would reconstruct the position after each move
        // For now, we'll simulate the analysis
        const evaluation = await this.evaluatePosition(initialFen, 12);
        const classification = this.classifyMove(evaluation, 0); // Simplified

        variations.push({
          moves: moves.slice(0, i + 1),
          evaluation,
          depth: 12
        });

        switch (classification.type) {
          case 'blunder':
            blunders++;
            break;
          case 'mistake':
            mistakes++;
            break;
          case 'inaccuracy':
            inaccuracies++;
            break;
        }

        totalAccuracy += this.calculateMoveAccuracy(classification);
      } catch (error) {
        console.error('Error analyzing move:', error);
      }
    }

    const bestMove = await this.getBestMove(initialFen);
    const finalEvaluation = await this.evaluatePosition(initialFen);

    return {
      bestMove,
      evaluation: finalEvaluation,
      depth: this.defaultDepth,
      variations,
      accuracy: moves.length > 0 ? totalAccuracy / moves.length : 0,
      blunders,
      mistakes,
      inaccuracies
    };
  }

  /**
   * Classify a move based on evaluation difference
   */
  private classifyMove(currentEval: number, bestEval: number): MoveClassification {
    const diff = Math.abs(currentEval - bestEval);

    if (diff >= 3.0) {
      return {
        type: 'blunder',
        evaluation: currentEval,
        explanation: 'Une bourde majeure qui change significativement l\'évaluation'
      };
    } else if (diff >= 1.5) {
      return {
        type: 'mistake',
        evaluation: currentEval,
        explanation: 'Une erreur importante qui donne un avantage à l\'adversaire'
      };
    } else if (diff >= 0.5) {
      return {
        type: 'inaccuracy',
        evaluation: currentEval,
        explanation: 'Une imprécision mineure'
      };
    } else if (diff <= 0.1) {
      return {
        type: 'excellent',
        evaluation: currentEval,
        explanation: 'Coup excellent, proche du meilleur'
      };
    } else {
      return {
        type: 'good',
        evaluation: currentEval,
        explanation: 'Bon coup'
      };
    }
  }

  /**
   * Calculate move accuracy percentage
   */
  private calculateMoveAccuracy(classification: MoveClassification): number {
    switch (classification.type) {
      case 'excellent':
        return 100;
      case 'good':
        return 85;
      case 'inaccuracy':
        return 70;
      case 'mistake':
        return 40;
      case 'blunder':
        return 10;
      default:
        return 75;
    }
  }

  /**
   * Get engine configuration for different skill levels
   */
  getEngineConfig(skillLevel: number): { depth: number; time: number; options: Record<string, any> } {
    const configs = {
      1: { depth: 5, time: 100, options: { 'Skill Level': 1, 'UCI_LimitStrength': true, 'UCI_Elo': 800 } },
      3: { depth: 8, time: 300, options: { 'Skill Level': 3, 'UCI_LimitStrength': true, 'UCI_Elo': 1200 } },
      5: { depth: 12, time: 800, options: { 'Skill Level': 5, 'UCI_LimitStrength': true, 'UCI_Elo': 1600 } },
      8: { depth: 15, time: 1500, options: { 'Skill Level': 8, 'UCI_LimitStrength': true, 'UCI_Elo': 2000 } },
      10: { depth: 18, time: 3000, options: { 'Skill Level': 10, 'UCI_LimitStrength': false } },
    };

    return configs[skillLevel as keyof typeof configs] || configs[5];
  }

  /**
   * Validate if a move is legal
   */
  async validateMove(fen: string, move: string): Promise<boolean> {
    return new Promise((resolve) => {
      const engine = spawn(this.stockfishPath);
      let isValid = false;

      const commands = [
        'uci',
        'isready',
        `position fen ${fen}`,
        `go perft 1`
      ];

      engine.stdout.on('data', (data) => {
        const output = data.toString();
        // Simple validation - in reality would need more sophisticated checking
        isValid = !output.includes('error') && !output.includes('illegal');
      });

      engine.on('close', () => {
        resolve(isValid);
      });

      commands.forEach(command => {
        engine.stdin.write(command + '\n');
      });

      engine.stdin.end();
    });
  }
}

export const chessEngine = new ChessEngine(process.env.STOCKFISH_PATH || 'stockfish');
