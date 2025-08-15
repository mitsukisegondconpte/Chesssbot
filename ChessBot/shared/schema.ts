import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const gameStatusEnum = pgEnum('game_status', ['active', 'completed', 'abandoned']);
export const gameResultEnum = pgEnum('game_result', ['white_wins', 'black_wins', 'draw']);
export const tournamentStatusEnum = pgEnum('tournament_status', ['upcoming', 'active', 'completed', 'cancelled']);
export const notificationTypeEnum = pgEnum('notification_type', ['game_invite', 'tournament_start', 'game_reminder']);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: varchar("telegram_id").unique(),
  username: text("username").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  nickname: text("nickname"),
  eloRating: integer("elo_rating").default(1200),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  gamesLost: integer("games_lost").default(0),
  gamesDrawn: integer("games_drawn").default(0),
  isActive: boolean("is_active").default(true),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Games table
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  whitePlayerId: varchar("white_player_id").references(() => users.id),
  blackPlayerId: varchar("black_player_id").references(() => users.id),
  status: gameStatusEnum("status").default('active'),
  result: gameResultEnum("result"),
  boardState: text("board_state"), // FEN notation
  moveHistory: jsonb("move_history"), // Array of moves in algebraic notation
  whiteEloChange: integer("white_elo_change").default(0),
  blackEloChange: integer("black_elo_change").default(0),
  duration: integer("duration_seconds"),
  isRated: boolean("is_rated").default(true),
  tournamentId: varchar("tournament_id"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tournaments table
export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: tournamentStatusEnum("status").default('upcoming'),
  maxParticipants: integer("max_participants").default(16),
  currentParticipants: integer("current_participants").default(0),
  isAutomated: boolean("is_automated").default(false),
  prizePool: text("prize_pool"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  winnerId: varchar("winner_id").references(() => users.id),
  rules: jsonb("rules"), // Tournament specific rules
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tournament participants
export const tournamentParticipants = pgTable("tournament_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").references(() => tournaments.id),
  userId: varchar("user_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  eliminated: boolean("eliminated").default(false),
  finalRank: integer("final_rank"),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"), // Additional notification data
  createdAt: timestamp("created_at").defaultNow(),
});

// Game analysis table
export const gameAnalyses = pgTable("game_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").references(() => games.id),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  blunders: integer("blunders").default(0),
  mistakes: integer("mistakes").default(0),
  inaccuracies: integer("inaccuracies").default(0),
  suggestions: jsonb("suggestions"), // AI suggestions for improvement
  analysisData: jsonb("analysis_data"), // Detailed analysis results
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  whiteGames: many(games, { relationName: "whitePlayer" }),
  blackGames: many(games, { relationName: "blackPlayer" }),
  tournaments: many(tournamentParticipants),
  notifications: many(notifications),
  createdTournaments: many(tournaments, { relationName: "creator" }),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  whitePlayer: one(users, { 
    fields: [games.whitePlayerId], 
    references: [users.id],
    relationName: "whitePlayer"
  }),
  blackPlayer: one(users, { 
    fields: [games.blackPlayerId], 
    references: [users.id],
    relationName: "blackPlayer"
  }),
  tournament: one(tournaments, {
    fields: [games.tournamentId],
    references: [tournaments.id]
  }),
  analysis: one(gameAnalyses, {
    fields: [games.id],
    references: [gameAnalyses.gameId]
  }),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  participants: many(tournamentParticipants),
  games: many(games),
  winner: one(users, {
    fields: [tournaments.winnerId],
    references: [users.id]
  }),
  creator: one(users, {
    fields: [tournaments.createdBy],
    references: [users.id],
    relationName: "creator"
  }),
}));

export const tournamentParticipantsRelations = relations(tournamentParticipants, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentParticipants.tournamentId],
    references: [tournaments.id]
  }),
  user: one(users, {
    fields: [tournamentParticipants.userId],
    references: [users.id]
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  }),
}));

export const gameAnalysesRelations = relations(gameAnalyses, ({ one }) => ({
  game: one(games, {
    fields: [gameAnalyses.gameId],
    references: [games.id]
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertGameAnalysisSchema = createInsertSchema(gameAnalyses).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type GameAnalysis = typeof gameAnalyses.$inferSelect;
export type InsertGameAnalysis = z.infer<typeof insertGameAnalysisSchema>;
