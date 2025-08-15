import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { ChessTelegramBot } from './bot';
import { createStartKeyboard, createGameOverKeyboard, createSettingsKeyboard } from './keyboards';
import { formatUserName, formatTimeAgo } from './utils';

export async function handleStartCommand(
  msg: TelegramBot.Message, 
  bot: ChessTelegramBot
): Promise<void> {
  const chatId = msg.chat.id;
  const user = msg.from;

  if (!user) return;

  try {
    // Check if user exists in database
    let dbUser = await storage.getUserByTelegramId(user.id.toString());

    if (!dbUser) {
      // Create new user
      dbUser = await storage.createUser({
        telegramId: user.id.toString(),
        username: user.username || `user_${user.id}`,
        firstName: user.first_name,
        lastName: user.last_name,
        eloRating: 1200,
        isActive: true,
      });
    } else {
      // Update last active
      await storage.updateUser(dbUser.id, {
        lastActive: new Date(),
        isActive: true,
      });
    }

    const userName = formatUserName(dbUser);
    const welcomeMessage = `🏆 **Bot d'Échecs Français** 🏆

Bonjour ${userName} ! 

Bienvenue dans votre bot d'échecs personnel. Vous pouvez jouer contre le moteur Stockfish avec différents niveaux de difficulté.

🎯 **Fonctionnalités :**
♟️ Parties contre l'IA Stockfish
🎨 Échiquier visuel interactif
📊 Suivi de votre progression ELO
🏆 Classement global des joueurs
📈 Analyses de parties détaillées
⚙️ Niveaux de difficulté réglables

**Votre profil :**
🏅 Rating ELO: ${dbUser.eloRating}
🎮 Parties jouées: ${dbUser.gamesPlayed}
🏆 Victoires: ${dbUser.gamesWon}

Utilisez les boutons ci-dessous pour commencer !`;

    const keyboard = createStartKeyboard();

    await bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

  } catch (error) {
    console.error('Error in handleStartCommand:', error);
    await bot.sendMessage(chatId, '❌ Une erreur est survenue. Veuillez réessayer.');
  }
}

export async function handleNewGameCommand(
  msg: TelegramBot.Message, 
  bot: ChessTelegramBot
): Promise<void> {
  const chatId = msg.chat.id;
  const user = msg.from;

  if (!user) return;

  try {
    const dbUser = await storage.getUserByTelegramId(user.id.toString());
    if (!dbUser) {
      await bot.sendMessage(chatId, '❌ Utilisateur non trouvé. Utilisez /start pour vous enregistrer.');
      return;
    }

    await bot.createNewGame(chatId, dbUser.id);

  } catch (error) {
    console.error('Error in handleNewGameCommand:', error);
    await bot.sendMessage(chatId, '❌ Erreur lors de la création de la partie.');
  }
}

export async function handleStatsCommand(
  msg: TelegramBot.Message, 
  bot: ChessTelegramBot
): Promise<void> {
  const chatId = msg.chat.id;
  const user = msg.from;

  if (!user) return;

  try {
    const dbUser = await storage.getUserByTelegramId(user.id.toString());
    if (!dbUser) {
      await bot.sendMessage(chatId, '❌ Utilisateur non trouvé. Utilisez /start pour vous enregistrer.');
      return;
    }

    const userStats = await storage.getUserStats(dbUser.id);
    const winRate = userStats.stats.totalGames > 0 
      ? ((userStats.stats.wins / userStats.stats.totalGames) * 100).toFixed(1)
      : '0';

    // Calculate rank among all players
    const topPlayers = await storage.getTopPlayers(1000);
    const userRank = topPlayers.findIndex(p => p.id === dbUser.id) + 1;

    // Get recent games
    const recentGames = await storage.getGamesByUser(dbUser.id, 5);
    
    let recentGamesText = '';
    if (recentGames.length > 0) {
      recentGamesText = '\n\n**Parties récentes:**\n';
      recentGames.forEach((game, index) => {
        const result = game.result === 'white_wins' ? '✅ Victoire' :
                      game.result === 'black_wins' ? '❌ Défaite' :
                      game.result === 'draw' ? '⚖️ Nul' : '🎮 En cours';
        const timeAgo = formatTimeAgo(game.startedAt);
        recentGamesText += `${index + 1}. ${result} - ${timeAgo}\n`;
      });
    }

    const statsMessage = `📊 **Vos Statistiques**

👤 **Profil**
${formatUserName(userStats)} 
🏅 Rating ELO: **${userStats.eloRating}**
🏆 Classement: #${userRank || 'Non classé'}

📈 **Performances**
🎮 Parties jouées: ${userStats.stats.totalGames}
✅ Victoires: ${userStats.stats.wins}
❌ Défaites: ${userStats.stats.losses}
⚖️ Nuls: ${userStats.stats.draws}
📊 Taux de victoire: **${winRate}%**

📅 **Activité**
Dernière connexion: ${formatTimeAgo(userStats.lastActive)}
Membre depuis: ${formatTimeAgo(userStats.createdAt)}${recentGamesText}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🆕 Nouvelle Partie', callback_data: 'new_game' },
          { text: '🏆 Classement Global', callback_data: 'rankings' }
        ],
        [
          { text: '📈 Analyses Détaillées', callback_data: 'analysis_history' },
          { text: '⚙️ Paramètres', callback_data: 'settings' }
        ],
        [
          { text: '🏠 Menu Principal', callback_data: 'main_menu' }
        ]
      ]
    };

    await bot.sendMessage(chatId, statsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

  } catch (error) {
    console.error('Error in handleStatsCommand:', error);
    await bot.sendMessage(chatId, '❌ Erreur lors de la récupération des statistiques.');
  }
}

export async function handleHelpCommand(
  msg: TelegramBot.Message, 
  bot: ChessTelegramBot
): Promise<void> {
  const chatId = msg.chat.id;

  const helpMessage = `📖 **Aide - Bot d'Échecs Français**

🎯 **Comment jouer:**
1️⃣ Utilisez /new ou "🆕 Nouvelle partie"
2️⃣ L'échiquier s'affiche avec les coups possibles
3️⃣ Cliquez sur un bouton ou tapez votre coup (ex: e4, Nf3)
4️⃣ L'IA Stockfish joue automatiquement après vous

♟️ **Commandes disponibles:**
/start - Menu principal et inscription
/new - Commencer une nouvelle partie
/stats - Voir vos statistiques détaillées
/ranking - Classement des meilleurs joueurs
/settings - Modifier les paramètres (niveau IA)
/help - Afficher cette aide

🎮 **Notation des coups:**
• Pions: e4, d5, exd5 (prise)
• Pièces: Nf3, Bb5, Qh5, Rc1
• Roque: O-O (petit), O-O-O (grand)
• Promotion: e8=Q (promotion en dame)

🤖 **Niveaux Stockfish:**
• Niveau 1-5: Débutant
• Niveau 6-10: Intermédiaire  
• Niveau 11-15: Avancé
• Niveau 16-20: Expert/Maître

🏆 **Système ELO:**
• Rating de départ: 1200
• Gain/perte selon la performance
• Classement mis à jour en temps réel

📊 **Fonctionnalités avancées:**
• Analyses de parties automatiques
• Suggestions d'amélioration
• Historique complet des parties
• Export PGN et FEN
• Statistiques détaillées

💡 **Conseils:**
• Prenez votre temps pour réfléchir
• Analysez vos parties terminées
• Variez vos ouvertures
• Ajustez le niveau selon votre progression`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🆕 Nouvelle Partie', callback_data: 'new_game' },
          { text: '⚙️ Paramètres', callback_data: 'settings' }
        ],
        [
          { text: '📊 Mes Statistiques', callback_data: 'stats' },
          { text: '🏆 Classement', callback_data: 'rankings' }
        ],
        [
          { text: '🏠 Menu Principal', callback_data: 'main_menu' }
        ]
      ]
    };

    await bot.sendMessage(chatId, helpMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
}

export async function handleCallbackQuery(
  query: TelegramBot.CallbackQuery, 
  bot: ChessTelegramBot
): Promise<void> {
  const chatId = query.message?.chat.id;
  const data = query.data;
  const user = query.from;

  if (!chatId || !data || !user) return;

  try {
    await bot.botInstance.answerCallbackQuery(query.id);

    switch (data) {
      case 'new_game':
        const dbUser = await storage.getUserByTelegramId(user.id.toString());
        if (dbUser) {
          await bot.createNewGame(chatId, dbUser.id);
        }
        break;

      case 'stats':
        await handleStatsCommand({ chat: { id: chatId }, from: user } as TelegramBot.Message, bot);
        break;

      case 'help':
        await handleHelpCommand({ chat: { id: chatId } } as TelegramBot.Message, bot);
        break;

      case 'rankings':
        await handleRankingsCallback(chatId, bot);
        break;

      case 'settings':
        await handleSettingsCallback(chatId, bot);
        break;

      case 'main_menu':
        await handleStartCommand({ chat: { id: chatId }, from: user } as TelegramBot.Message, bot);
        break;

      case 'resign':
        await handleResignCallback(chatId, bot);
        break;

      case 'analysis_history':
        await handleAnalysisHistoryCallback(chatId, user, bot);
        break;

      default:
        if (data.startsWith('move_')) {
          const move = data.substring(5);
          await bot.processPlayerMove(chatId, move);
        } else if (data.startsWith('skill_')) {
          const level = parseInt(data.substring(6));
          await bot.updateSkillLevel(chatId, level);
        } else if (data.startsWith('export_')) {
          const format = data.substring(7);
          await handleExportCallback(chatId, user, format, bot);
        }
        break;
    }

  } catch (error) {
    console.error('Error in handleCallbackQuery:', error);
    await bot.sendMessage(chatId, '❌ Une erreur est survenue.');
  }
}

async function handleRankingsCallback(chatId: number, bot: ChessTelegramBot): Promise<void> {
  try {
    const topPlayers = await storage.getTopPlayers(15);
    
    let rankingMessage = '🏆 **Classement des Meilleurs Joueurs**\n\n';
    
    topPlayers.forEach((player, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      const name = formatUserName(player);
      const stats = `${player.gamesWon}V/${player.gamesPlayed}P`;
      rankingMessage += `${medal} **${name}**\n   📊 ${player.eloRating} ELO • ${stats}\n\n`;
    });

    if (topPlayers.length === 0) {
      rankingMessage += 'Aucun joueur classé pour le moment.\nSoyez le premier à jouer une partie !';
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🆕 Nouvelle Partie', callback_data: 'new_game' },
          { text: '📊 Mes Stats', callback_data: 'stats' }
        ],
        [
          { text: '🏠 Menu Principal', callback_data: 'main_menu' }
        ]
      ]
    };

    await bot.sendMessage(chatId, rankingMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    console.error('Error in handleRankingsCallback:', error);
    await bot.sendMessage(chatId, '❌ Erreur lors de l\'affichage du classement.');
  }
}

async function handleSettingsCallback(chatId: number, bot: ChessTelegramBot): Promise<void> {
  const session = bot.getActiveSessions().find(s => s.chatId === chatId);
  const currentLevel = session?.skillLevel || 5;

  const settingsMessage = `⚙️ **Paramètres du Bot**

🤖 **Niveau de l'IA Stockfish**
Niveau actuel: **${currentLevel}/20**

**Description des niveaux:**
• 1-5: 🟢 Débutant (800-1200 ELO)
• 6-10: 🟡 Intermédiaire (1200-1600 ELO)  
• 11-15: 🟠 Avancé (1600-2000 ELO)
• 16-20: 🔴 Expert+ (2000+ ELO)

Choisissez un niveau adapté à votre force pour des parties équilibrées et instructives.`;

  const keyboard = createSettingsKeyboard();

  await bot.sendMessage(chatId, settingsMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

async function handleResignCallback(chatId: number, bot: ChessTelegramBot): Promise<void> {
  const sessions = bot.getActiveSessions();
  const session = sessions.find(s => s.chatId === chatId);

  if (!session) {
    await bot.sendMessage(chatId, '❌ Aucune partie en cours à abandonner.');
    return;
  }

  try {
    // Update game as resigned
    await storage.updateGame(session.gameId, {
      status: 'completed',
      result: 'black_wins', // AI wins by resignation
      completedAt: new Date(),
    });

    // Update user stats
    const user = await storage.getUser(session.userId);
    if (user) {
      const eloChange = -16; // Standard resignation penalty
      await storage.updateUser(session.userId, {
        eloRating: user.eloRating + eloChange,
        gamesPlayed: user.gamesPlayed + 1,
        gamesLost: user.gamesLost + 1,
      });
    }

    const resignMessage = `🏳️ **Partie Abandonnée**

Vous avez abandonné la partie. L'IA remporte la victoire.

📊 **Impact sur votre rating:**
ELO: ${user?.eloRating} → ${(user?.eloRating || 0) - 16} (-16)

Ne vous découragez pas ! Chaque partie est une opportunité d'apprentissage.`;

    const keyboard = createGameOverKeyboard();

    await bot.sendMessage(chatId, resignMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    console.error('Error in handleResignCallback:', error);
    await bot.sendMessage(chatId, '❌ Erreur lors de l\'abandon de la partie.');
  }
}

async function handleAnalysisHistoryCallback(
  chatId: number, 
  user: TelegramBot.User, 
  bot: ChessTelegramBot
): Promise<void> {
  try {
    const dbUser = await storage.getUserByTelegramId(user.id.toString());
    if (!dbUser) return;

    const recentGames = await storage.getGamesByUser(dbUser.id, 10);
    const completedGames = recentGames.filter(g => g.status === 'completed');

    if (completedGames.length === 0) {
      await bot.sendMessage(chatId, '📈 **Analyses de Parties**\n\nAucune partie terminée à analyser.\nJouez quelques parties pour voir vos analyses !');
      return;
    }

    let analysisMessage = '📈 **Historique des Analyses**\n\n';

    for (let i = 0; i < Math.min(5, completedGames.length); i++) {
      const game = completedGames[i];
      const analysis = await storage.getGameAnalysis(game.id);
      
      const result = game.result === 'white_wins' ? '✅' :
                    game.result === 'black_wins' ? '❌' : '⚖️';
      const date = formatTimeAgo(game.startedAt);
      
      if (analysis) {
        analysisMessage += `${i + 1}. ${result} Partie du ${date}\n`;
        analysisMessage += `   📊 Précision: ${analysis.accuracy?.toFixed(1)}%\n`;
        analysisMessage += `   🎯 Bourdes: ${analysis.blunders} | Erreurs: ${analysis.mistakes}\n\n`;
      } else {
        analysisMessage += `${i + 1}. ${result} Partie du ${date}\n`;
        analysisMessage += `   ⏳ Analyse en cours...\n\n`;
      }
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔍 Analyser Dernière Partie', callback_data: `analyze_${completedGames[0].id}` },
        ],
        [
          { text: '📊 Mes Stats', callback_data: 'stats' },
          { text: '🏠 Menu Principal', callback_data: 'main_menu' }
        ]
      ]
    };

    await bot.sendMessage(chatId, analysisMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

  } catch (error) {
    console.error('Error in handleAnalysisHistoryCallback:', error);
    await bot.sendMessage(chatId, '❌ Erreur lors de la récupération des analyses.');
  }
}

async function handleExportCallback(
  chatId: number, 
  user: TelegramBot.User, 
  format: string, 
  bot: ChessTelegramBot
): Promise<void> {
  try {
    const dbUser = await storage.getUserByTelegramId(user.id.toString());
    if (!dbUser) return;

    const recentGames = await storage.getGamesByUser(dbUser.id, 1);
    if (recentGames.length === 0) {
      await bot.sendMessage(chatId, '❌ Aucune partie à exporter.');
      return;
    }

    const game = recentGames[0];

    switch (format) {
      case 'pgn':
        const pgn = generatePGN(game);
        await bot.sendMessage(chatId, `📋 **Export PGN**\n\n\`\`\`\n${pgn}\n\`\`\``, {
          parse_mode: 'Markdown'
        });
        break;

      case 'fen':
        const fen = game.boardState || 'Position non disponible';
        await bot.sendMessage(chatId, `📄 **Position FEN**\n\n\`${fen}\`\n\nCopiez cette position pour l'analyser dans votre logiciel d'échecs !`, {
          parse_mode: 'Markdown'
        });
        break;

      default:
        await bot.sendMessage(chatId, '❌ Format d\'export non supporté.');
    }

  } catch (error) {
    console.error('Error in handleExportCallback:', error);
    await bot.sendMessage(chatId, '❌ Erreur lors de l\'export.');
  }
}

function generatePGN(game: any): string {
  const moves = game.moveHistory as string[] || [];
  const date = new Date(game.startedAt).toISOString().split('T')[0];
  
  let result = '*';
  if (game.result === 'white_wins') result = '1-0';
  else if (game.result === 'black_wins') result = '0-1';
  else if (game.result === 'draw') result = '1/2-1/2';

  const pgn = `[Event "Partie Telegram Chess Bot"]
[Date "${date}"]
[White "Joueur"]
[Black "Stockfish"]
[Result "${result}"]

${moves.join(' ')} ${result}`;

  return pgn;
}
