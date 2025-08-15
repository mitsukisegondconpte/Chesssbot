import { apiRequest } from "./queryClient";

// Dashboard API
export const dashboardApi = {
  getStats: () => apiRequest('GET', '/api/dashboard/stats'),
  getTopPlayers: (limit = 10) => apiRequest('GET', `/api/dashboard/top-players?limit=${limit}`),
  getRecentGames: (limit = 20) => apiRequest('GET', `/api/dashboard/recent-games?limit=${limit}`),
};

// Users API
export const usersApi = {
  getAll: (limit = 50, offset = 0) => apiRequest('GET', `/api/users?limit=${limit}&offset=${offset}`),
  getById: (id: string) => apiRequest('GET', `/api/users/${id}`),
  create: (userData: any) => apiRequest('POST', '/api/users', userData),
  update: (id: string, updates: any) => apiRequest('PATCH', `/api/users/${id}`, updates),
  getStats: (id: string) => apiRequest('GET', `/api/users/${id}/stats`),
};

// Games API
export const gamesApi = {
  getAll: (limit = 50) => apiRequest('GET', `/api/games?limit=${limit}`),
  getActive: () => apiRequest('GET', '/api/games/active'),
  getById: (id: string) => apiRequest('GET', `/api/games/${id}`),
  create: (gameData: any) => apiRequest('POST', '/api/games', gameData),
  update: (id: string, updates: any) => apiRequest('PATCH', `/api/games/${id}`, updates),
  getAnalysis: (id: string) => apiRequest('GET', `/api/games/${id}/analysis`),
  createAnalysis: (id: string, analysisData: any) => apiRequest('POST', `/api/games/${id}/analysis`, analysisData),
};

// Tournaments API
export const tournamentsApi = {
  getAll: (limit = 20) => apiRequest('GET', `/api/tournaments?limit=${limit}`),
  getActive: () => apiRequest('GET', '/api/tournaments/active'),
  getById: (id: string) => apiRequest('GET', `/api/tournaments/${id}`),
  create: (tournamentData: any) => apiRequest('POST', '/api/tournaments', tournamentData),
  update: (id: string, updates: any) => apiRequest('PATCH', `/api/tournaments/${id}`, updates),
  join: (id: string, userId: string) => apiRequest('POST', `/api/tournaments/${id}/join`, { userId }),
  getParticipants: (id: string) => apiRequest('GET', `/api/tournaments/${id}/participants`),
};

// Notifications API
export const notificationsApi = {
  getByUser: (userId: string, unreadOnly = false) => 
    apiRequest('GET', `/api/notifications/${userId}?unreadOnly=${unreadOnly}`),
  markAsRead: (id: string) => apiRequest('PATCH', `/api/notifications/${id}/read`),
  create: (notificationData: any) => apiRequest('POST', '/api/notifications', notificationData),
  delete: (id: string) => apiRequest('DELETE', `/api/notifications/${id}`),
};

// Analytics API
export const analyticsApi = {
  getOverview: (period = 'all') => apiRequest('GET', `/api/analytics/overview?period=${period}`),
  getPlayerAnalytics: (playerId: string, period = 'all') => 
    apiRequest('GET', `/api/analytics/player/${playerId}?period=${period}`),
  getGameAnalytics: (gameId: string) => apiRequest('GET', `/api/analytics/game/${gameId}`),
  getOpeningStats: (playerId?: string) => 
    apiRequest('GET', `/api/analytics/openings${playerId ? `?playerId=${playerId}` : ''}`),
  getTournamentAnalytics: (tournamentId: string) => 
    apiRequest('GET', `/api/analytics/tournament/${tournamentId}`),
  generateReport: (type: string, filters: any) => 
    apiRequest('POST', '/api/analytics/report', { type, filters }),
};

// ELO API
export const eloApi = {
  getRankings: (limit = 50, offset = 0) => 
    apiRequest('GET', `/api/elo/rankings?limit=${limit}&offset=${offset}`),
  getPlayerRank: (playerId: string) => apiRequest('GET', `/api/elo/player/${playerId}/rank`),
  getEloHistory: (playerId: string, period = '3months') => 
    apiRequest('GET', `/api/elo/player/${playerId}/history?period=${period}`),
  calculateEloChange: (player1Elo: number, player2Elo: number, result: string) =>
    apiRequest('POST', '/api/elo/calculate', { player1Elo, player2Elo, result }),
};

// Chess Engine API
export const chessEngineApi = {
  analyzeGame: (gameId: string, depth = 15) => 
    apiRequest('POST', `/api/chess/analyze/${gameId}`, { depth }),
  getMove: (fen: string, difficulty = 5, timeLimit = 1000) => 
    apiRequest('POST', '/api/chess/move', { fen, difficulty, timeLimit }),
  validateMove: (fen: string, move: string) => 
    apiRequest('POST', '/api/chess/validate', { fen, move }),
  getGameEvaluation: (fen: string) => 
    apiRequest('POST', '/api/chess/evaluate', { fen }),
};

// Telegram Bot API
export const telegramBotApi = {
  getStats: () => apiRequest('GET', '/api/telegram/stats'),
  sendMessage: (chatId: string, message: string, options?: any) => 
    apiRequest('POST', '/api/telegram/send', { chatId, message, options }),
  broadcastMessage: (message: string, filters?: any) => 
    apiRequest('POST', '/api/telegram/broadcast', { message, filters }),
  getUsers: (active = true) => apiRequest('GET', `/api/telegram/users?active=${active}`),
  getUserByTelegramId: (telegramId: string) => 
    apiRequest('GET', `/api/telegram/user/${telegramId}`),
};

// Admin API
export const adminApi = {
  getSystemStats: () => apiRequest('GET', '/api/admin/stats'),
  getErrorLogs: (limit = 100) => apiRequest('GET', `/api/admin/logs/errors?limit=${limit}`),
  getActivity: (period = '24h') => apiRequest('GET', `/api/admin/activity?period=${period}`),
  createBackup: () => apiRequest('POST', '/api/admin/backup'),
  getBackups: () => apiRequest('GET', '/api/admin/backups'),
  restoreBackup: (backupId: string) => apiRequest('POST', `/api/admin/backup/${backupId}/restore`),
  updateConfig: (config: any) => apiRequest('PUT', '/api/admin/config', config),
  getConfig: () => apiRequest('GET', '/api/admin/config'),
};

// File Export API
export const exportApi = {
  exportGames: (filters?: any, format = 'pgn') => 
    apiRequest('POST', '/api/export/games', { filters, format }),
  exportUsers: (filters?: any, format = 'csv') => 
    apiRequest('POST', '/api/export/users', { filters, format }),
  exportTournaments: (filters?: any, format = 'json') => 
    apiRequest('POST', '/api/export/tournaments', { filters, format }),
  exportAnalytics: (type: string, period: string, format = 'pdf') => 
    apiRequest('POST', '/api/export/analytics', { type, period, format }),
};
