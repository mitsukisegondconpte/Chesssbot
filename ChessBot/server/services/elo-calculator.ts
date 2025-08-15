/**
 * ELO Rating System Calculator
 * Based on the standard FIDE ELO rating system with adjustments for online chess
 */

export interface EloResult {
  newRatingPlayer1: number;
  newRatingPlayer2: number;
  changePlayer1: number;
  changePlayer2: number;
}

export interface EloCalculationOptions {
  kFactor?: number;
  provisionalThreshold?: number;
  ratingFloor?: number;
  ratingCeiling?: number;
}

export class EloCalculator {
  private static readonly DEFAULT_K_FACTOR = 32;
  private static readonly HIGH_RATING_THRESHOLD = 2400;
  private static readonly LOW_RATING_K_FACTOR = 40;
  private static readonly MEDIUM_RATING_K_FACTOR = 32;
  private static readonly HIGH_RATING_K_FACTOR = 16;
  private static readonly PROVISIONAL_GAMES_THRESHOLD = 30;
  private static readonly RATING_FLOOR = 100;
  private static readonly RATING_CEILING = 3000;

  /**
   * Calculate expected score for a player against an opponent
   */
  static calculateExpectedScore(playerRating: number, opponentRating: number): number {
    const ratingDifference = opponentRating - playerRating;
    return 1 / (1 + Math.pow(10, ratingDifference / 400));
  }

  /**
   * Determine K-factor based on player rating and experience
   */
  static calculateKFactor(
    playerRating: number, 
    gamesPlayed: number, 
    options?: EloCalculationOptions
  ): number {
    if (options?.kFactor) {
      return options.kFactor;
    }

    // Provisional players (less than 30 games) get higher K-factor
    if (gamesPlayed < (options?.provisionalThreshold || this.PROVISIONAL_GAMES_THRESHOLD)) {
      return this.LOW_RATING_K_FACTOR;
    }

    // Adjust K-factor based on rating
    if (playerRating >= this.HIGH_RATING_THRESHOLD) {
      return this.HIGH_RATING_K_FACTOR;
    } else if (playerRating >= 2100) {
      return this.MEDIUM_RATING_K_FACTOR;
    } else {
      return this.LOW_RATING_K_FACTOR;
    }
  }

  /**
   * Calculate new ELO ratings after a game
   */
  static calculateNewRatings(
    player1Rating: number,
    player2Rating: number,
    player1GamesPlayed: number,
    player2GamesPlayed: number,
    result: 'player1_wins' | 'player2_wins' | 'draw',
    options?: EloCalculationOptions
  ): EloResult {
    // Calculate expected scores
    const expectedScore1 = this.calculateExpectedScore(player1Rating, player2Rating);
    const expectedScore2 = this.calculateExpectedScore(player2Rating, player1Rating);

    // Determine actual scores based on result
    let actualScore1: number;
    let actualScore2: number;

    switch (result) {
      case 'player1_wins':
        actualScore1 = 1;
        actualScore2 = 0;
        break;
      case 'player2_wins':
        actualScore1 = 0;
        actualScore2 = 1;
        break;
      case 'draw':
        actualScore1 = 0.5;
        actualScore2 = 0.5;
        break;
      default:
        throw new Error('Invalid game result');
    }

    // Calculate K-factors
    const kFactor1 = this.calculateKFactor(player1Rating, player1GamesPlayed, options);
    const kFactor2 = this.calculateKFactor(player2Rating, player2GamesPlayed, options);

    // Calculate rating changes
    const change1 = Math.round(kFactor1 * (actualScore1 - expectedScore1));
    const change2 = Math.round(kFactor2 * (actualScore2 - expectedScore2));

    // Calculate new ratings
    let newRating1 = player1Rating + change1;
    let newRating2 = player2Rating + change2;

    // Apply rating floor and ceiling
    const floor = options?.ratingFloor || this.RATING_FLOOR;
    const ceiling = options?.ratingCeiling || this.RATING_CEILING;

    newRating1 = Math.max(floor, Math.min(ceiling, newRating1));
    newRating2 = Math.max(floor, Math.min(ceiling, newRating2));

    return {
      newRatingPlayer1: newRating1,
      newRatingPlayer2: newRating2,
      changePlayer1: newRating1 - player1Rating,
      changePlayer2: newRating2 - player2Rating,
    };
  }

  /**
   * Calculate ELO change for a single player (simplified version)
   */
  static calculateEloChange(
    playerRating: number,
    opponentRating: number,
    result: 'win' | 'loss' | 'draw',
    gamesPlayed: number = 50
  ): number {
    const expectedScore = this.calculateExpectedScore(playerRating, opponentRating);
    
    let actualScore: number;
    switch (result) {
      case 'win':
        actualScore = 1;
        break;
      case 'loss':
        actualScore = 0;
        break;
      case 'draw':
        actualScore = 0.5;
        break;
      default:
        throw new Error('Invalid result');
    }

    const kFactor = this.calculateKFactor(playerRating, gamesPlayed);
    return Math.round(kFactor * (actualScore - expectedScore));
  }

  /**
   * Calculate rating performance for a tournament or series of games
   */
  static calculatePerformanceRating(
    results: Array<{
      opponentRating: number;
      result: 'win' | 'loss' | 'draw';
    }>
  ): number {
    if (results.length === 0) return 0;

    const totalScore = results.reduce((sum, game) => {
      switch (game.result) {
        case 'win': return sum + 1;
        case 'draw': return sum + 0.5;
        case 'loss': return sum + 0;
        default: return sum;
      }
    }, 0);

    const averageOpponentRating = results.reduce(
      (sum, game) => sum + game.opponentRating, 
      0
    ) / results.length;

    const scorePercentage = totalScore / results.length;

    // Convert score percentage to rating difference
    let ratingDifference: number;
    if (scorePercentage === 1) {
      ratingDifference = 400; // Perfect score
    } else if (scorePercentage === 0) {
      ratingDifference = -400; // No wins
    } else {
      ratingDifference = 400 * Math.log10(scorePercentage / (1 - scorePercentage));
    }

    return Math.round(averageOpponentRating + ratingDifference);
  }

  /**
   * Estimate required rating to achieve target score against opponent
   */
  static calculateRequiredRating(
    opponentRating: number,
    targetScore: number
  ): number {
    if (targetScore <= 0 || targetScore >= 1) {
      throw new Error('Target score must be between 0 and 1');
    }

    const ratingDifference = 400 * Math.log10(targetScore / (1 - targetScore));
    return Math.round(opponentRating + ratingDifference);
  }

  /**
   * Calculate rating reliability based on games played and rating deviation
   */
  static calculateRatingReliability(
    gamesPlayed: number,
    recentPerformanceVariance?: number
  ): {
    reliability: number; // 0-1 scale
    category: 'provisional' | 'established' | 'reliable' | 'highly_reliable';
  } {
    let baseReliability = Math.min(1, gamesPlayed / 100);
    
    // Adjust for performance variance if provided
    if (recentPerformanceVariance !== undefined) {
      const variancePenalty = Math.min(0.3, recentPerformanceVariance / 200);
      baseReliability *= (1 - variancePenalty);
    }

    let category: 'provisional' | 'established' | 'reliable' | 'highly_reliable';
    if (gamesPlayed < 10) {
      category = 'provisional';
    } else if (gamesPlayed < 50) {
      category = 'established';
    } else if (gamesPlayed < 100) {
      category = 'reliable';
    } else {
      category = 'highly_reliable';
    }

    return {
      reliability: baseReliability,
      category
    };
  }
}

/**
 * Simplified function for backward compatibility
 */
export function calculateEloChange(
  playerRating: number,
  opponentRating: number,
  result: string
): number {
  let gameResult: 'win' | 'loss' | 'draw';
  
  switch (result) {
    case 'white_wins':
    case 'player1_wins':
    case 'win':
      gameResult = 'win';
      break;
    case 'black_wins':
    case 'player2_wins':
    case 'loss':
      gameResult = 'loss';
      break;
    case 'draw':
      gameResult = 'draw';
      break;
    default:
      throw new Error(`Invalid game result: ${result}`);
  }

  return EloCalculator.calculateEloChange(playerRating, opponentRating, gameResult);
}

export default EloCalculator;
