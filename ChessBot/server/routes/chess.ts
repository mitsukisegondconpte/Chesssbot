import { Router } from 'express';
import { chessEngine } from '../services/chess-engine';
import { gameAnalysisService } from '../services/game-analysis';
import { z } from 'zod';

const router = Router();

// Validation schemas
const analyzeGameSchema = z.object({
  gameId: z.string(),
  depth: z.number().min(5).max(25).optional().default(15),
});

const getMoveSchema = z.object({
  fen: z.string(),
  difficulty: z.number().min(1).max(20).optional().default(5),
  timeLimit: z.number().min(100).max(10000).optional().default(1000),
});

const validateMoveSchema = z.object({
  fen: z.string(),
  move: z.string(),
});

const evaluatePositionSchema = z.object({
  fen: z.string(),
  depth: z.number().min(5).max(25).optional().default(15),
});

const analyzePositionSchema = z.object({
  fen: z.string(),
  depth: z.number().min(5).max(25).optional().default(15),
});

// Get best move for a position
router.post('/move', async (req, res) => {
  try {
    const { fen, difficulty, timeLimit } = getMoveSchema.parse(req.body);
    
    const config = chessEngine.getEngineConfig(difficulty);
    const bestMove = await chessEngine.getBestMove(fen, config.depth, timeLimit);
    
    res.json({
      move: bestMove,
      difficulty,
      engineConfig: config,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error getting move:', error);
    res.status(500).json({ error: 'Failed to get move from engine' });
  }
});

// Validate a move
router.post('/validate', async (req, res) => {
  try {
    const { fen, move } = validateMoveSchema.parse(req.body);
    
    const isValid = await chessEngine.validateMove(fen, move);
    
    res.json({
      isValid,
      move,
      fen,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error validating move:', error);
    res.status(500).json({ error: 'Failed to validate move' });
  }
});

// Evaluate a position
router.post('/evaluate', async (req, res) => {
  try {
    const { fen, depth } = evaluatePositionSchema.parse(req.body);
    
    const evaluation = await chessEngine.evaluatePosition(fen, depth);
    
    res.json({
      evaluation,
      fen,
      depth,
      interpretation: interpretEvaluation(evaluation),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error evaluating position:', error);
    res.status(500).json({ error: 'Failed to evaluate position' });
  }
});

// Analyze a specific position
router.post('/analyze-position', async (req, res) => {
  try {
    const { fen, depth } = analyzePositionSchema.parse(req.body);
    
    const analysis = await gameAnalysisService.analyzePosition(fen, depth);
    
    res.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error analyzing position:', error);
    res.status(500).json({ error: 'Failed to analyze position' });
  }
});

// Analyze a complete game
router.post('/analyze/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { depth } = analyzeGameSchema.parse({ gameId, ...req.body });
    
    const analysis = await gameAnalysisService.analyzeGame(gameId, depth);
    
    res.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error analyzing game:', error);
    res.status(500).json({ error: 'Failed to analyze game' });
  }
});

// Get engine configuration for different skill levels
router.get('/engine-config/:level', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    
    if (isNaN(level) || level < 1 || level > 20) {
      return res.status(400).json({ error: 'Skill level must be between 1 and 20' });
    }
    
    const config = chessEngine.getEngineConfig(level);
    
    res.json({
      level,
      config,
      description: getSkillLevelDescription(level),
    });
  } catch (error) {
    console.error('Error getting engine config:', error);
    res.status(500).json({ error: 'Failed to get engine configuration' });
  }
});

// Generate training exercises for a user
router.get('/training/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    
    const exercises = await gameAnalysisService.generateTrainingExercises(userId);
    
    res.json({
      exercises: exercises.slice(0, limit),
      userId,
      generated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating training exercises:', error);
    res.status(500).json({ error: 'Failed to generate training exercises' });
  }
});

// Get opening book moves (simplified)
router.get('/opening/:fen', async (req, res) => {
  try {
    const { fen } = req.params;
    
    // This would integrate with an opening book database
    // For now, return some common opening moves
    const openingMoves = await getOpeningMoves(fen);
    
    res.json({
      fen,
      moves: openingMoves,
      isOpeningPosition: openingMoves.length > 0,
    });
  } catch (error) {
    console.error('Error getting opening moves:', error);
    res.status(500).json({ error: 'Failed to get opening moves' });
  }
});

// Get endgame tablebase result (simplified)
router.get('/tablebase/:fen', async (req, res) => {
  try {
    const { fen } = req.params;
    
    // This would integrate with endgame tablebases (Syzygy, etc.)
    // For now, return a simplified analysis
    const tablebaseResult = await getTablebaseResult(fen);
    
    res.json({
      fen,
      result: tablebaseResult,
      isTablebasePosition: tablebaseResult !== null,
    });
  } catch (error) {
    console.error('Error getting tablebase result:', error);
    res.status(500).json({ error: 'Failed to get tablebase result' });
  }
});

// Helper functions
function interpretEvaluation(evaluation: number): string {
  if (evaluation > 5) return 'Avantage décisif pour les blancs';
  if (evaluation > 2) return 'Avantage important pour les blancs';
  if (evaluation > 0.5) return 'Léger avantage pour les blancs';
  if (evaluation > -0.5) return 'Position équilibrée';
  if (evaluation > -2) return 'Léger avantage pour les noirs';
  if (evaluation > -5) return 'Avantage important pour les noirs';
  return 'Avantage décisif pour les noirs';
}

function getSkillLevelDescription(level: number): string {
  if (level <= 5) return 'Débutant (800-1200 ELO)';
  if (level <= 10) return 'Intermédiaire (1200-1600 ELO)';
  if (level <= 15) return 'Avancé (1600-2000 ELO)';
  return 'Expert+ (2000+ ELO)';
}

async function getOpeningMoves(fen: string): Promise<Array<{ move: string; frequency: number; name?: string }>> {
  // Simplified opening book - in reality would query a database
  const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  if (fen === startingPosition) {
    return [
      { move: 'e2e4', frequency: 35, name: 'Ouverture du Pion Roi' },
      { move: 'd2d4', frequency: 30, name: 'Partie de la Dame' },
      { move: 'g1f3', frequency: 15, name: 'Ouverture Réti' },
      { move: 'c2c4', frequency: 10, name: 'Ouverture Anglaise' },
      { move: 'b1c3', frequency: 5, name: 'Attaque de Nimzowitsch' },
    ];
  }
  
  return [];
}

async function getTablebaseResult(fen: string): Promise<string | null> {
  // Simplified tablebase lookup - in reality would query actual tablebases
  const pieces = fen.split(' ')[0].replace(/[\/\d]/g, '');
  
  if (pieces.length <= 7) {
    // Simulate tablebase result for positions with 7 or fewer pieces
    return 'Résultat théorique disponible';
  }
  
  return null;
}

export default router;
