import TelegramBot from 'node-telegram-bot-api';

export function createStartKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🆕 Nouvelle Partie', callback_data: 'new_game' },
        { text: '📊 Mes Statistiques', callback_data: 'stats' }
      ],
      [
        { text: '🏆 Classement', callback_data: 'rankings' },
        { text: '⚙️ Paramètres', callback_data: 'settings' }
      ],
      [
        { text: '📖 Aide', callback_data: 'help' }
      ]
    ]
  };
}

export function createMoveKeyboard(
  availableMoves: string[], 
  gameId: string
): TelegramBot.InlineKeyboardMarkup {
  const buttons = [];
  
  // Group moves by piece type for better organization
  const pawnMoves = availableMoves.filter(move => /^[a-h][2-7]/.test(move));
  const pieceMoves = availableMoves.filter(move => /^[NBRQK]/.test(move));
  const castling = availableMoves.filter(move => move.includes('O'));
  const otherMoves = availableMoves.filter(move => 
    !pawnMoves.includes(move) && 
    !pieceMoves.includes(move) && 
    !castling.includes(move)
  );

  // Add pawn moves (max 4 per row)
  if (pawnMoves.length > 0) {
    for (let i = 0; i < pawnMoves.length; i += 4) {
      const row = pawnMoves.slice(i, i + 4).map(move => ({
        text: `♟ ${move}`,
        callback_data: `move_${move}`
      }));
      buttons.push(row);
    }
  }

  // Add piece moves (max 3 per row)
  if (pieceMoves.length > 0) {
    for (let i = 0; i < pieceMoves.length; i += 3) {
      const row = pieceMoves.slice(i, i + 3).map(move => {
        const piece = move[0];
        const symbol = getPieceSymbol(piece);
        return {
          text: `${symbol} ${move}`,
          callback_data: `move_${move}`
        };
      });
      buttons.push(row);
    }
  }

  // Add castling moves
  if (castling.length > 0) {
    const castlingRow = castling.map(move => ({
      text: `♔ ${move}`,
      callback_data: `move_${move}`
    }));
    buttons.push(castlingRow);
  }

  // Add other moves
  if (otherMoves.length > 0) {
    for (let i = 0; i < otherMoves.length; i += 4) {
      const row = otherMoves.slice(i, i + 4).map(move => ({
        text: move,
        callback_data: `move_${move}`
      }));
      buttons.push(row);
    }
  }

  // Add game control buttons
  buttons.push([
    { text: '📊 Statistiques', callback_data: 'stats' },
    { text: '🏳️ Abandonner', callback_data: 'resign' }
  ]);

  buttons.push([
    { text: '⚙️ Paramètres', callback_data: 'settings' },
    { text: '📖 Aide', callback_data: 'help' }
  ]);

  return { inline_keyboard: buttons };
}

export function createGameOverKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🆕 Nouvelle Partie', callback_data: 'new_game' },
        { text: '📊 Mes Stats', callback_data: 'stats' }
      ],
      [
        { text: '📈 Analyse de la Partie', callback_data: 'analyze_last' },
        { text: '🏆 Classement', callback_data: 'rankings' }
      ],
      [
        { text: '📋 Export PGN', callback_data: 'export_pgn' },
        { text: '📄 Export FEN', callback_data: 'export_fen' }
      ],
      [
        { text: '🏠 Menu Principal', callback_data: 'main_menu' }
      ]
    ]
  };
}

export function createSettingsKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🟢 Niveau 1', callback_data: 'skill_1' },
        { text: '🟢 Niveau 2', callback_data: 'skill_2' },
        { text: '🟢 Niveau 3', callback_data: 'skill_3' }
      ],
      [
        { text: '🟢 Niveau 4', callback_data: 'skill_4' },
        { text: '🟢 Niveau 5', callback_data: 'skill_5' },
        { text: '🟡 Niveau 6', callback_data: 'skill_6' }
      ],
      [
        { text: '🟡 Niveau 7', callback_data: 'skill_7' },
        { text: '🟡 Niveau 8', callback_data: 'skill_8' },
        { text: '🟡 Niveau 9', callback_data: 'skill_9' }
      ],
      [
        { text: '🟡 Niveau 10', callback_data: 'skill_10' },
        { text: '🟠 Niveau 11', callback_data: 'skill_11' },
        { text: '🟠 Niveau 12', callback_data: 'skill_12' }
      ],
      [
        { text: '🟠 Niveau 13', callback_data: 'skill_13' },
        { text: '🟠 Niveau 14', callback_data: 'skill_14' },
        { text: '🟠 Niveau 15', callback_data: 'skill_15' }
      ],
      [
        { text: '🔴 Niveau 16', callback_data: 'skill_16' },
        { text: '🔴 Niveau 17', callback_data: 'skill_17' },
        { text: '🔴 Niveau 18', callback_data: 'skill_18' }
      ],
      [
        { text: '🔴 Niveau 19', callback_data: 'skill_19' },
        { text: '🔴 Niveau 20', callback_data: 'skill_20' }
      ],
      [
        { text: '🏠 Menu Principal', callback_data: 'main_menu' }
      ]
    ]
  };
}

export function createAnalysisKeyboard(gameId: string): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🔍 Analyse Complète', callback_data: `analyze_full_${gameId}` },
        { text: '⚡ Analyse Rapide', callback_data: `analyze_quick_${gameId}` }
      ],
      [
        { text: '📊 Précision par Phase', callback_data: `analyze_phases_${gameId}` },
        { text: '🎯 Points Critiques', callback_data: `analyze_critical_${gameId}` }
      ],
      [
        { text: '📈 Suggestions d\'Amélioration', callback_data: `analyze_suggestions_${gameId}` }
      ],
      [
        { text: '📋 Export Analyse', callback_data: `export_analysis_${gameId}` },
        { text: '🏠 Menu Principal', callback_data: 'main_menu' }
      ]
    ]
  };
}

export function createTournamentKeyboard(tournamentId: string): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ S\'inscrire', callback_data: `tournament_join_${tournamentId}` },
        { text: '📊 Participants', callback_data: `tournament_participants_${tournamentId}` }
      ],
      [
        { text: '📋 Règlement', callback_data: `tournament_rules_${tournamentId}` },
        { text: '🏆 Lots', callback_data: `tournament_prizes_${tournamentId}` }
      ],
      [
        { text: '🏠 Menu Principal', callback_data: 'main_menu' }
      ]
    ]
  };
}

export function createConfirmKeyboard(action: string, data: string): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ Confirmer', callback_data: `confirm_${action}_${data}` },
        { text: '❌ Annuler', callback_data: 'cancel' }
      ]
    ]
  };
}

function getPieceSymbol(piece: string): string {
  switch (piece.toUpperCase()) {
    case 'K': return '♔';
    case 'Q': return '♕';
    case 'R': return '♖';
    case 'B': return '♗';
    case 'N': return '♘';
    case 'P': return '♙';
    default: return piece;
  }
}

export function createAdminKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '📊 Statistiques Bot', callback_data: 'admin_stats' },
        { text: '👥 Utilisateurs Actifs', callback_data: 'admin_users' }
      ],
      [
        { text: '🎮 Parties en Cours', callback_data: 'admin_games' },
        { text: '🏆 Tournois', callback_data: 'admin_tournaments' }
      ],
      [
        { text: '📢 Message Global', callback_data: 'admin_broadcast' },
        { text: '🧹 Nettoyage', callback_data: 'admin_cleanup' }
      ],
      [
        { text: '⚙️ Configuration', callback_data: 'admin_config' },
        { text: '🏠 Menu Principal', callback_data: 'main_menu' }
      ]
    ]
  };
}

export function createRankingKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🥇 Top 10', callback_data: 'ranking_top10' },
        { text: '🏆 Top 50', callback_data: 'ranking_top50' }
      ],
      [
        { text: '📈 Progression Mensuelle', callback_data: 'ranking_monthly' },
        { text: '⭐ Joueurs de la Semaine', callback_data: 'ranking_weekly' }
      ],
      [
        { text: '🎯 Ma Position', callback_data: 'ranking_myrank' },
        { text: '📊 Statistiques Globales', callback_data: 'ranking_global_stats' }
      ],
      [
        { text: '🏠 Menu Principal', callback_data: 'main_menu' }
      ]
    ]
  };
}
