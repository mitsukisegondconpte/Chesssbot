import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertGameSchema, insertTournamentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard API
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/top-players", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topPlayers = await storage.getTopPlayers(limit);
      res.json(topPlayers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top players" });
    }
  });

  app.get("/api/dashboard/recent-games", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const recentGames = await storage.getRecentGames(limit);
      res.json(recentGames);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent games" });
    }
  });

  // Users API
  app.get("/api/users", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const users = await storage.getAllUsers(limit, offset);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUserStats(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, updates);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Games API
  app.get("/api/games", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const games = await storage.getRecentGames(limit);
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.get("/api/games/active", async (req, res) => {
    try {
      const activeGames = await storage.getActiveGames();
      res.json(activeGames);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active games" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game" });
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid game data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  app.patch("/api/games/:id", async (req, res) => {
    try {
      const updates = insertGameSchema.partial().parse(req.body);
      const game = await storage.updateGame(req.params.id, updates);
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid game data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update game" });
    }
  });

  app.get("/api/games/:id/analysis", async (req, res) => {
    try {
      const analysis = await storage.getGameAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Game analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game analysis" });
    }
  });

  // Tournaments API
  app.get("/api/tournaments", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const tournaments = await storage.getAllTournaments(limit);
      res.json(tournaments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tournaments" });
    }
  });

  app.get("/api/tournaments/active", async (req, res) => {
    try {
      const activeTournaments = await storage.getActiveTournaments();
      res.json(activeTournaments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active tournaments" });
    }
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.getTournament(req.params.id);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tournament" });
    }
  });

  app.post("/api/tournaments", async (req, res) => {
    try {
      const tournamentData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(tournamentData);
      res.json(tournament);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tournament data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create tournament" });
    }
  });

  app.post("/api/tournaments/:id/join", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      await storage.joinTournament(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to join tournament" });
    }
  });

  // Notifications API
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const unreadOnly = req.query.unreadOnly === 'true';
      const notifications = await storage.getUserNotifications(req.params.userId, unreadOnly);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
