export function formatUserName(user: any): string {
  if (user.nickname) return user.nickname;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.username) return `@${user.username}`;
  return 'Utilisateur';
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "à l'instant";
  if (diffInMinutes < 60) return `il y a ${diffInMinutes}min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "hier";
  if (diffInDays < 7) return `il y a ${diffInDays}j`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return "la semaine dernière";
  if (diffInWeeks < 4) return `il y a ${diffInWeeks} semaines`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) return "le mois dernier";
  if (diffInMonths < 12) return `il y a ${diffInMonths} mois`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

export function formatEloChange(change: number): string {
  if (change > 0) return `+${change}`;
  return change.toString();
}

export function formatGameResult(result: string, perspective: 'white' | 'black' = 'white'): string {
  switch (result) {
    case 'white_wins':
      return perspective === 'white' ? '✅ Victoire' : '❌ Défaite';
    case 'black_wins':
      return perspective === 'white' ? '❌ Défaite' : '✅ Victoire';
    case 'draw':
      return '⚖️ Match nul';
    default:
      return '🎮 En cours';
  }
}

export function formatGameMessage(
  game: any, 
  currentPlayer: 'white' | 'black',
  moveMessage?: string
): string {
  const status = game.status === 'active' ? 
    (currentPlayer === 'white' ? '🟢 À votre tour' : '🔴 Tour de l\'adversaire') :
    formatGameResult(game.result, currentPlayer);

  const moveText = moveMessage ? `\n\n${moveMessage}` : '';
  const checkStatus = ''; // Would check if king is in check

  return `♟️ **Partie en cours**${moveText}

${status}${checkStatus}`;
}

export function formatStatsMessage(userStats: any): string {
  const winRate = userStats.stats.totalGames > 0 
    ? ((userStats.stats.wins / userStats.stats.totalGames) * 100).toFixed(1)
    : '0';

  return `📊 **Vos Statistiques**

👤 **Profil**
${formatUserName(userStats)}
🏅 Rating ELO: **${userStats.eloRating}**

📈 **Performances**
🎮 Parties jouées: ${userStats.stats.totalGames}
✅ Victoires: ${userStats.stats.wins}
❌ Défaites: ${userStats.stats.losses}
⚖️ Nuls: ${userStats.stats.draws}
📊 Taux de victoire: **${winRate}%**

📅 **Activité**
Dernière activité: ${formatTimeAgo(userStats.lastActive)}
Membre depuis: ${formatTimeAgo(userStats.createdAt)}`;
}

export function formatRankingMessage(players: any[]): string {
  let message = '🏆 **Classement des Meilleurs Joueurs**\n\n';
  
  players.forEach((player, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    const name = formatUserName(player);
    const stats = `${player.gamesWon}V/${player.gamesPlayed}P`;
    message += `${medal} **${name}**\n   📊 ${player.eloRating} ELO • ${stats}\n\n`;
  });

  if (players.length === 0) {
    message += 'Aucun joueur classé pour le moment.\nSoyez le premier à jouer une partie !';
  }

  return message;
}

export function formatTournamentMessage(tournament: any): string {
  const status = formatTournamentStatus(tournament.status);
  const participants = `${tournament.currentParticipants}/${tournament.maxParticipants}`;
  
  return `🏆 **${tournament.name}**

${tournament.description || 'Tournoi d\'échecs compétitif'}

📊 **Informations**
Statut: ${status}
Participants: ${participants}
${tournament.startTime ? `Début: ${formatTimeAgo(tournament.startTime)}` : ''}
${tournament.prizePool ? `Prix: ${tournament.prizePool}` : ''}

${tournament.isAutomated ? '🤖 Tournoi automatisé' : '👥 Tournoi manuel'}`;
}

export function formatTournamentStatus(status: string): string {
  switch (status) {
    case 'upcoming':
      return '⏳ À venir';
    case 'active':
      return '🔴 En cours';
    case 'completed':
      return '✅ Terminé';
    case 'cancelled':
      return '❌ Annulé';
    default:
      return status;
  }
}

export function formatAnalysisMessage(analysis: any): string {
  return `📈 **Analyse de Partie**

📊 **Précision Globale**
Précision moyenne: **${analysis.accuracy?.toFixed(1)}%**

🎯 **Qualité des Coups**
✨ Coups excellents: ${analysis.excellent || 0}
👍 Bons coups: ${analysis.good || 0}
⚠️ Imprécisions: ${analysis.inaccuracies}
❌ Erreurs: ${analysis.mistakes}
💥 Bourdes: ${analysis.blunders}

💡 **Suggestions d'Amélioration**
${analysis.suggestions?.slice(0, 3).map((s: string) => `• ${s}`).join('\n') || 'Aucune suggestion disponible'}`;
}

export function formatMoveList(moves: string[]): string {
  if (!moves || moves.length === 0) return 'Aucun coup joué';

  let moveList = '';
  for (let i = 0; i < moves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = moves[i];
    const blackMove = moves[i + 1] || '';
    
    moveList += `${moveNumber}. ${whiteMove}`;
    if (blackMove) moveList += ` ${blackMove}`;
    if (i < moves.length - 2) moveList += ' ';
  }

  return moveList;
}

export function parseChessMove(moveText: string): { isValid: boolean; move?: string; error?: string } {
  const trimmed = moveText.trim();
  
  // Basic validation patterns
  const patterns = [
    /^[a-h][1-8]$/, // Simple pawn move (e4)
    /^[a-h]x[a-h][1-8]$/, // Pawn capture (exd5)
    /^[NBRQK][a-h]?[1-8]?x?[a-h][1-8]$/, // Piece move (Nf3, Nxf3, N1f3)
    /^O-O(-O)?$/, // Castling
    /^[a-h][1-8]=[NBRQ]$/, // Pawn promotion (e8=Q)
    /^[a-h]x[a-h][1-8]=[NBRQ]$/, // Pawn capture with promotion
  ];

  const isValid = patterns.some(pattern => pattern.test(trimmed));
  
  if (!isValid) {
    return {
      isValid: false,
      error: 'Format de coup invalide. Utilisez la notation algébrique (ex: e4, Nf3, O-O)'
    };
  }

  return {
    isValid: true,
    move: trimmed
  };
}

export function escapeMarkdown(text: string): string {
  // Escape Telegram Markdown v2 special characters
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

export function formatBoardPosition(fen: string): string {
  // Generate a simple text representation of the chess board
  const position = fen.split(' ')[0];
  const ranks = position.split('/');
  
  let board = '```\n  a b c d e f g h\n';
  
  for (let i = 0; i < 8; i++) {
    let rank = `${8 - i} `;
    const rankStr = ranks[i];
    
    for (const char of rankStr) {
      if (isNaN(parseInt(char))) {
        const symbol = getPieceUnicode(char);
        rank += `${symbol} `;
      } else {
        rank += '· '.repeat(parseInt(char));
      }
    }
    board += rank + `${8 - i}\n`;
  }
  
  board += '  a b c d e f g h\n```';
  return board;
}

function getPieceUnicode(piece: string): string {
  const pieces: { [key: string]: string } = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };
  return pieces[piece] || piece;
}

export function generateGameSummary(game: any): string {
  const duration = game.completedAt && game.startedAt 
    ? Math.floor((new Date(game.completedAt).getTime() - new Date(game.startedAt).getTime()) / 1000)
    : null;

  const moves = (game.moveHistory as string[]) || [];
  const moveCount = moves.length;

  return `🏁 **Résumé de Partie**

⏱️ Durée: ${duration ? formatDuration(duration) : 'Non disponible'}
🎯 Nombre de coups: ${moveCount}
📊 Résultat: ${formatGameResult(game.result)}

${game.whiteEloChange !== undefined ? `📈 Changement ELO: ${formatEloChange(game.whiteEloChange)}` : ''}`;
}
