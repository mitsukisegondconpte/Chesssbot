import { 
  users, 
  games, 
  tournaments, 
  tournamentParticipants,
  notifications,
  gameAnalyses,
  type User, 
  type InsertUser,
  type Game,
  type InsertGame,
  type Tournament,
  type InsertTournament,
  type Notification,
  type InsertNotification,
  type GameAnalysis,
  type InsertGameAnalysis
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getUserStats(userId: string): Promise<any>;
  
  // Games
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<InsertGame>): Promise<Game>;
  getGamesByUser(userId: string, limit?: number): Promise<Game[]>;
  getRecentGames(limit?: number): Promise<Game[]>;
  getActiveGames(): Promise<Game[]>;
  
  // Tournaments
  getTournament(id: string): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: string, updates: Partial<InsertTournament>): Promise<Tournament>;
  getAllTournaments(limit?: number): Promise<Tournament[]>;
  getActiveTournaments(): Promise<Tournament[]>;
  joinTournament(tournamentId: string, userId: string): Promise<void>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  
  // Analytics
  getDashboardStats(): Promise<any>;
  getTopPlayers(limit?: number): Promise<any[]>;
  getGameAnalysis(gameId: string): Promise<GameAnalysis | undefined>;
  createGameAnalysis(analysis: InsertGameAnalysis): Promise<GameAnalysis>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        updatedAt: new Date()
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return await db.select().from(users)
      .orderBy(desc(users.lastActive))
      .limit(limit)
      .offset(offset);
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;

    const gameStats = await db.select({
      totalGames: count(),
      wins: sql<number>`SUM(CASE WHEN ${games.result} = 'white_wins' AND ${games.whitePlayerId} = ${userId} 
                                    OR ${games.result} = 'black_wins' AND ${games.blackPlayerId} = ${userId} THEN 1 ELSE 0 END)`,
      losses: sql<number>`SUM(CASE WHEN ${games.result} = 'white_wins' AND ${games.blackPlayerId} = ${userId} 
                                     OR ${games.result} = 'black_wins' AND ${games.whitePlayerId} = ${userId} THEN 1 ELSE 0 END)`,
      draws: sql<number>`SUM(CASE WHEN ${games.result} = 'draw' THEN 1 ELSE 0 END)`,
    }).from(games)
      .where(or(eq(games.whitePlayerId, userId), eq(games.blackPlayerId, userId)));

    return {
      ...user,
      stats: gameStats[0]
    };
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values({
        ...insertGame,
        updatedAt: new Date()
      })
      .returning();
    return game;
  }

  async updateGame(id: string, updates: Partial<InsertGame>): Promise<Game> {
    const [game] = await db
      .update(games)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(games.id, id))
      .returning();
    return game;
  }

  async getGamesByUser(userId: string, limit = 20): Promise<Game[]> {
    return await db.select().from(games)
      .where(or(eq(games.whitePlayerId, userId), eq(games.blackPlayerId, userId)))
      .orderBy(desc(games.startedAt))
      .limit(limit);
  }

  async getRecentGames(limit = 50): Promise<Game[]> {
    return await db.select().from(games)
      .orderBy(desc(games.startedAt))
      .limit(limit);
  }

  async getActiveGames(): Promise<Game[]> {
    return await db.select().from(games)
      .where(eq(games.status, 'active'))
      .orderBy(desc(games.startedAt));
  }

  async getTournament(id: string): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament || undefined;
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const [tournament] = await db
      .insert(tournaments)
      .values({
        ...insertTournament,
        updatedAt: new Date()
      })
      .returning();
    return tournament;
  }

  async updateTournament(id: string, updates: Partial<InsertTournament>): Promise<Tournament> {
    const [tournament] = await db
      .update(tournaments)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(tournaments.id, id))
      .returning();
    return tournament;
  }

  async getAllTournaments(limit = 20): Promise<Tournament[]> {
    return await db.select().from(tournaments)
      .orderBy(desc(tournaments.createdAt))
      .limit(limit);
  }

  async getActiveTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments)
      .where(or(eq(tournaments.status, 'active'), eq(tournaments.status, 'upcoming')))
      .orderBy(desc(tournaments.startTime));
  }

  async joinTournament(tournamentId: string, userId: string): Promise<void> {
    await db.insert(tournamentParticipants).values({
      tournamentId,
      userId,
    });

    // Update participant count
    await db.update(tournaments)
      .set({
        currentParticipants: sql`${tournaments.currentParticipants} + 1`,
        updatedAt: new Date()
      })
      .where(eq(tournaments.id, tournamentId));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    const query = db.select().from(notifications)
      .where(eq(notifications.userId, userId));
    
    if (unreadOnly) {
      query.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    }

    return await query.orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getDashboardStats(): Promise<any> {
    const totalUsers = await db.select({ count: count() }).from(users);
    const activeUsers = await db.select({ count: count() }).from(users)
      .where(sql`${users.lastActive} > NOW() - INTERVAL '30 days'`);
    const totalGames = await db.select({ count: count() }).from(games);
    const activeTournaments = await db.select({ count: count() }).from(tournaments)
      .where(eq(tournaments.status, 'active'));
    const completedGames = await db.select({ count: count() }).from(games)
      .where(eq(games.status, 'completed'));

    return {
      totalUsers: totalUsers[0].count,
      activeUsers: activeUsers[0].count,
      totalGames: totalGames[0].count,
      completedGames: completedGames[0].count,
      activeTournaments: activeTournaments[0].count,
    };
  }

  async getTopPlayers(limit = 10): Promise<any[]> {
    return await db.select({
      id: users.id,
      username: users.username,
      nickname: users.nickname,
      eloRating: users.eloRating,
      gamesPlayed: users.gamesPlayed,
      gamesWon: users.gamesWon,
    }).from(users)
      .orderBy(desc(users.eloRating))
      .limit(limit);
  }

  async getGameAnalysis(gameId: string): Promise<GameAnalysis | undefined> {
    const [analysis] = await db.select().from(gameAnalyses)
      .where(eq(gameAnalyses.gameId, gameId));
    return analysis || undefined;
  }

  async createGameAnalysis(insertAnalysis: InsertGameAnalysis): Promise<GameAnalysis> {
    const [analysis] = await db
      .insert(gameAnalyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }
}

export const storage = new DatabaseStorage();
