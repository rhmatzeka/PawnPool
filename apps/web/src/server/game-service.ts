import { Chess } from 'chess.js';
import { INITIAL_FEN, MAX_HALF_MOVES, MAX_NO_VOTE_REOPEN, PIECE_PRIORITY, VOTING_DURATION_SECONDS } from 'shared';
import { prisma } from './prisma';
import { ChessStateService } from './chess-state';

const TURN_DURATION_MS = VOTING_DURATION_SECONDS * 1000;

function addWei(a: string, b: string) {
  return (BigInt(a) + BigInt(b)).toString();
}

function jsonSafe<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)));
}

async function getBestMove(fen: string, legalMoves: string[]) {
  if (legalMoves.length === 0) {
    throw new Error('NO_LEGAL_MOVES');
  }

  let bestMove = legalMoves[0];
  let bestScore = -Infinity;

  for (const move of legalMoves) {
    const chess = new Chess(fen);
    const to = move.slice(2, 4);
    const targetPiece = chess.get(to as any);
    const values: Record<string, number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
    const score = targetPiece ? values[targetPiece.type] || 0 : 0;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

async function resolveBestMoveForPiece(fen: string, team: 'WHITE' | 'BLACK', winningPiece: string, fallbackPieces: string[]) {
  let targetPiece = winningPiece;
  let legalMoves = ChessStateService.getLegalMovesForPiece(fen, targetPiece, team);

  if (legalMoves.length === 0) {
    for (const fallback of fallbackPieces) {
      legalMoves = ChessStateService.getLegalMovesForPiece(fen, fallback, team);
      if (legalMoves.length > 0) {
        targetPiece = fallback;
        break;
      }
    }
  }

  if (legalMoves.length === 0) {
    throw new Error('NO_LEGAL_MOVES_FOR_VOTED_PIECES');
  }

  const bestMoveUci = await getBestMove(fen, legalMoves);
  const from = bestMoveUci.slice(0, 2);
  const to = bestMoveUci.slice(2, 4);
  const validation = ChessStateService.validateMove(fen, from, to);

  if (!validation.isValid || !validation.fenAfter || !validation.san) {
    throw new Error('RESOLVED_MOVE_INVALID');
  }

  return {
    from,
    to,
    uci: bestMoveUci,
    san: validation.san,
    fenBefore: fen,
    fenAfter: validation.fenAfter,
    targetPiece,
  };
}

export class VercelGameService {
  private static resolvingGames = new Set<string>();

  public static async createGame() {
    const now = Date.now();
    const gameId = `game_${now}`;
    const chainGameId = String(now);

    const game = await prisma.game.create({
      data: {
        id: gameId,
        chainGameId,
        status: 'ACTIVE',
        currentFen: INITIAL_FEN,
        currentTurn: 'WHITE',
        turnNumber: 1,
        turnStatus: 'OPEN',
      },
    });

    await prisma.turn.create({
      data: {
        gameId,
        turnNumber: 1,
        team: 'WHITE',
        status: 'OPEN',
        openedAt: new Date(),
        endsAt: new Date(Date.now() + TURN_DURATION_MS),
      },
    });

    return jsonSafe(game);
  }

  public static async getActiveGameOrCreate() {
    const game = await prisma.game.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    return game || this.createGame();
  }

  public static async getGameState(gameId: string) {
    await this.resolveExpiredTurnIfNeeded(gameId);

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        turns: {
          orderBy: { turnNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!game) return null;

    const bets = await prisma.bet.findMany({
      where: {
        gameId,
        turnNumber: game.turnNumber,
        status: 'CONFIRMED_VALID',
      },
    });

    const votes = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'].map((piece) => {
      const pieceBets = bets.filter((bet: { piece: string }) => bet.piece === piece);
      const firstBetAt = pieceBets.reduce((earliest: string | null, bet: { createdAt: Date }) => {
        const createdAt = bet.createdAt.toISOString();
        return !earliest || createdAt < earliest ? createdAt : earliest;
      }, null);

      return {
        piece,
        totalAmountWei: pieceBets.reduce((sum: bigint, bet: { amountWei: string }) => sum + BigInt(bet.amountWei), BigInt(0)).toString(),
        bettorCount: pieceBets.length,
        firstBetAt,
      };
    });

    const legalPieces = this.getLegalPiecesForTurn(game.currentFen, game.currentTurn as 'WHITE' | 'BLACK');

    return jsonSafe({
      gameId: game.id,
      chainGameId: game.chainGameId,
      status: game.status,
      result: game.result,
      fen: game.currentFen,
      currentTurn: game.currentTurn,
      turnNumber: game.turnNumber,
      turnStatus: game.turnStatus,
      turnEndsAt: game.turns[0]?.endsAt || null,
      whitePoolWei: game.whitePoolWei,
      blackPoolWei: game.blackPoolWei,
      votes,
      legalPieces,
    });
  }

  private static getLegalPiecesForTurn(fen: string, team: 'WHITE' | 'BLACK') {
    return ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'].filter((piece) => (
      ChessStateService.getLegalMovesForPiece(fen, piece, team).length > 0
    ));
  }

  private static async resolveExpiredTurnIfNeeded(gameId: string) {
    if (this.resolvingGames.has(gameId)) return;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { turns: { orderBy: { turnNumber: 'desc' }, take: 1 } },
    });

    const currentTurn = game?.turns[0];
    if (!game || game.status !== 'ACTIVE' || game.turnStatus !== 'OPEN' || !currentTurn?.endsAt || new Date() < currentTurn.endsAt) {
      return;
    }

    this.resolvingGames.add(gameId);
    try {
      await this.resolveExpiredTurn(gameId, true);
    } catch (err) {
      console.error('Auto resolve expired turn failed:', err);
    } finally {
      this.resolvingGames.delete(gameId);
    }
  }

  public static async placeBetMock(gameId: string, address: string, team: 'WHITE' | 'BLACK', piece: string, amountWei: string) {
    const game = await prisma.game.findUnique({ where: { id: gameId } });

    if (!game || game.status !== 'ACTIVE') throw new Error('GAME_NOT_ACTIVE');
    if (game.turnStatus !== 'OPEN') throw new Error('TURN_LOCKED');
    if (team !== game.currentTurn) throw new Error('WRONG_TEAM_TURN');
    if (!this.getLegalPiecesForTurn(game.currentFen, game.currentTurn as 'WHITE' | 'BLACK').includes(piece)) {
      throw new Error('PIECE_HAS_NO_LEGAL_MOVE');
    }

    const existingLock = await prisma.playerGameState.findUnique({
      where: { gameId_address: { gameId, address } },
    });

    if (existingLock && existingLock.lockedTeam !== team) throw new Error('TEAM_ALREADY_LOCKED');

    if (!existingLock) {
      await prisma.playerGameState.create({
        data: { gameId, userId: address, address, lockedTeam: team },
      });
    }

    const doubleBet = await prisma.bet.findFirst({
      where: { gameId, turnNumber: game.turnNumber, address },
    });

    if (doubleBet) throw new Error('ALREADY_BET_THIS_TURN');

    const user = await prisma.user.upsert({
      where: { address },
      create: { address },
      update: {},
    });

    const bet = await prisma.bet.create({
      data: {
        gameId,
        userId: user.id,
        address,
        turnNumber: game.turnNumber,
        team,
        piece,
        amountWei,
        status: 'CONFIRMED_VALID',
        txHash: `vercel_tx_${Date.now()}_${Math.random()}`,
      },
    });

    await prisma.game.update({
      where: { id: gameId },
      data: team === 'WHITE'
        ? { whitePoolWei: addWei(game.whitePoolWei, amountWei) }
        : { blackPoolWei: addWei(game.blackPoolWei, amountWei) },
    });

    return jsonSafe(bet);
  }

  public static async getSettlement(gameId: string, address: string) {
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new Error('GAME_NOT_FOUND');

    const bets = await prisma.bet.findMany({
      where: { gameId, address, status: 'CONFIRMED_VALID' },
    });

    const whiteAmount = bets
      .filter((bet) => bet.team === 'WHITE')
      .reduce((sum, bet) => sum + BigInt(bet.amountWei), BigInt(0));
    const blackAmount = bets
      .filter((bet) => bet.team === 'BLACK')
      .reduce((sum, bet) => sum + BigInt(bet.amountWei), BigInt(0));
    const totalUserBet = whiteAmount + blackAmount;
    const totalPool = BigInt(game.whitePoolWei) + BigInt(game.blackPoolWei);
    const rewardPool = totalPool > BigInt(0) ? (totalPool * BigInt(9000)) / BigInt(10000) : BigInt(0);

    let type: 'REWARD' | 'REFUND' | 'NONE' = 'NONE';
    let claimableWei = BigInt(0);
    let reason = 'Game is not settled yet.';

    if (game.status === 'CANCELLED') {
      type = totalUserBet > BigInt(0) ? 'REFUND' : 'NONE';
      claimableWei = totalUserBet;
      reason = type === 'REFUND' ? 'Game cancelled. Full demo refund is available.' : 'No bets found for this address.';
    } else if (game.status === 'FINISHED' && game.result === 'DRAW') {
      type = totalUserBet > BigInt(0) ? 'REFUND' : 'NONE';
      claimableWei = totalPool > BigInt(0) ? (totalUserBet * rewardPool) / totalPool : BigInt(0);
      reason = type === 'REFUND' ? 'Game draw. 90% demo pool refund is available.' : 'No bets found for this address.';
    } else if (game.status === 'FINISHED' && (game.winner === 'WHITE' || game.winner === 'BLACK')) {
      const winningAmount = game.winner === 'WHITE' ? whiteAmount : blackAmount;
      const winningPool = BigInt(game.winner === 'WHITE' ? game.whitePoolWei : game.blackPoolWei);
      type = winningAmount > BigInt(0) ? 'REWARD' : 'NONE';
      claimableWei = winningPool > BigInt(0) ? (winningAmount * rewardPool) / winningPool : BigInt(0);
      reason = type === 'REWARD' ? `Team ${game.winner} won. Demo reward is available.` : `Team ${game.winner} won. This address has no winning bets.`;
    }

    const alreadyClaimed = bets.some((bet) => bet.claimedAt || bet.refundedAt);
    if (alreadyClaimed) {
      claimableWei = BigInt(0);
      reason = 'This demo settlement was already claimed.';
    }

    return jsonSafe({
      gameId,
      address,
      gameStatus: game.status,
      result: game.result,
      winner: game.winner,
      type,
      claimableWei: claimableWei.toString(),
      totalUserBetWei: totalUserBet.toString(),
      whiteAmountWei: whiteAmount.toString(),
      blackAmountWei: blackAmount.toString(),
      totalPoolWei: totalPool.toString(),
      rewardPoolWei: rewardPool.toString(),
      alreadyClaimed,
      reason,
    });
  }

  public static async claimSettlement(gameId: string, address: string) {
    const settlement = await this.getSettlement(gameId, address);
    if (BigInt(settlement.claimableWei) <= BigInt(0)) {
      return settlement;
    }

    const now = new Date();
    await prisma.bet.updateMany({
      where: { gameId, address, status: 'CONFIRMED_VALID' },
      data: settlement.type === 'REWARD' ? { claimedAt: now } : { refundedAt: now },
    });

    return {
      ...settlement,
      alreadyClaimed: true,
      claimedAt: now.toISOString(),
      reason: `${settlement.type === 'REWARD' ? 'Reward' : 'Refund'} marked as claimed in demo mode.`,
    };
  }

  public static async getGameBettors(gameId: string) {
    const bets = await prisma.bet.findMany({
      where: { gameId, status: 'CONFIRMED_VALID' },
      orderBy: { createdAt: 'asc' },
    });

    const byAddress = new Map<string, { address: string; team: string; totalWei: bigint; betCount: number }>();

    for (const bet of bets) {
      const current = byAddress.get(bet.address) || {
        address: bet.address,
        team: bet.team,
        totalWei: BigInt(0),
        betCount: 0,
      };

      current.totalWei += BigInt(bet.amountWei);
      current.betCount += 1;
      byAddress.set(bet.address, current);
    }

    return jsonSafe([...byAddress.values()].map((bettor) => ({
      ...bettor,
      totalWei: bettor.totalWei.toString(),
    })));
  }

  public static async resolveExpiredTurn(gameId: string, skipStateRefresh = false) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { turns: { orderBy: { turnNumber: 'desc' }, take: 1 } },
    });

    if (!game || game.status !== 'ACTIVE' || game.turnStatus !== 'OPEN') {
      throw new Error('GAME_NOT_RESOLVABLE');
    }

    const currentTurn = game.turns[0];
    if (!currentTurn?.endsAt || new Date() < currentTurn.endsAt) {
      throw new Error('TURN_NOT_EXPIRED');
    }

    await prisma.game.update({ where: { id: gameId }, data: { turnStatus: 'LOCKED' } });

    const state = skipStateRefresh ? await this.getGameStateSnapshot(gameId) : await this.getGameState(gameId);
    const validVotes = state?.votes.filter((vote) => BigInt(vote.totalAmountWei) > BigInt(0)) || [];
    let winningPiece = '';
    let fallbackPieces: string[] = [];

    if (validVotes.length > 0) {
      const sorted = [...validVotes].sort((a, b) => {
        const amtA = BigInt(a.totalAmountWei);
        const amtB = BigInt(b.totalAmountWei);
        if (amtB !== amtA) return amtB > amtA ? 1 : -1;
        if (b.bettorCount !== a.bettorCount) return b.bettorCount - a.bettorCount;
        if (a.firstBetAt && b.firstBetAt && a.firstBetAt !== b.firstBetAt) return a.firstBetAt < b.firstBetAt ? -1 : 1;
        return PIECE_PRIORITY.indexOf(a.piece as any) - PIECE_PRIORITY.indexOf(b.piece as any);
      });

      winningPiece = sorted[0].piece;
      fallbackPieces = sorted.slice(1).map((vote) => vote.piece);
    }

    if (!winningPiece) {
      if (currentTurn.voteReopenCount < MAX_NO_VOTE_REOPEN) {
        const newEndsAt = new Date(Date.now() + TURN_DURATION_MS);
        await prisma.turn.update({
          where: { id: currentTurn.id },
          data: { voteReopenCount: currentTurn.voteReopenCount + 1, endsAt: newEndsAt, status: 'OPEN' },
        });
        await prisma.game.update({ where: { id: gameId }, data: { turnStatus: 'OPEN', noVoteCount: game.noVoteCount + 1 } });
        return { status: 'REOPENED' };
      }

      await prisma.game.update({ where: { id: gameId }, data: { status: 'CANCELLED', result: 'CANCELLED', turnStatus: 'FAILED' } });
      return { status: 'CANCELLED' };
    }

    try {
      const resolution = await resolveBestMoveForPiece(game.currentFen, game.currentTurn as 'WHITE' | 'BLACK', winningPiece, fallbackPieces);

      await prisma.move.create({
        data: {
          gameId,
          turnNumber: game.turnNumber,
          fromSquare: resolution.from,
          toSquare: resolution.to,
          piece: `${game.currentTurn}_${resolution.targetPiece}`,
          san: resolution.san,
          uci: resolution.uci,
          fenBefore: resolution.fenBefore,
          fenAfter: resolution.fenAfter,
        },
      });

      await prisma.turn.update({
        where: { id: currentTurn.id },
        data: { status: 'RESOLVED', resolvedAt: new Date(), lockedAt: new Date(), winningPiece: resolution.targetPiece },
      });

      const gameCheck = ChessStateService.checkGameResult(resolution.fenAfter);
      const nextTurnTeam = game.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE';
      const nextTurnNumber = game.turnNumber + 1;

      if (nextTurnNumber > MAX_HALF_MOVES && !gameCheck.isGameOver) {
        gameCheck.isGameOver = true;
        gameCheck.result = 'DRAW';
      }

      if (gameCheck.isGameOver && gameCheck.result) {
        await prisma.game.update({
          where: { id: gameId },
          data: {
            currentFen: resolution.fenAfter,
            status: 'FINISHED',
            result: gameCheck.result,
            winner: gameCheck.result === 'DRAW' ? 'DRAW' : gameCheck.result === 'WHITE_WIN' ? 'WHITE' : 'BLACK',
            turnStatus: 'RESOLVED',
          },
        });

        return { status: 'FINISHED', result: gameCheck.result };
      }

      const newEndsAt = new Date(Date.now() + TURN_DURATION_MS);
      await prisma.game.update({
        where: { id: gameId },
        data: { currentFen: resolution.fenAfter, currentTurn: nextTurnTeam, turnNumber: nextTurnNumber, turnStatus: 'OPEN' },
      });
      await prisma.turn.create({
        data: { gameId, turnNumber: nextTurnNumber, team: nextTurnTeam, status: 'OPEN', openedAt: new Date(), endsAt: newEndsAt },
      });

      return { status: 'NEXT_TURN', turnNumber: nextTurnNumber };
    } catch (err) {
      await prisma.game.update({ where: { id: gameId }, data: { turnStatus: 'OPEN' } });
      throw err;
    }
  }

  private static async getGameStateSnapshot(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { turns: { orderBy: { turnNumber: 'desc' }, take: 1 } },
    });

    if (!game) return null;

    const bets = await prisma.bet.findMany({
      where: { gameId, turnNumber: game.turnNumber, status: 'CONFIRMED_VALID' },
    });

    return {
      votes: ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'].map((piece) => {
        const pieceBets = bets.filter((bet: { piece: string }) => bet.piece === piece);
        const firstBetAt = pieceBets.reduce((earliest: string | null, bet: { createdAt: Date }) => {
          const createdAt = bet.createdAt.toISOString();
          return !earliest || createdAt < earliest ? createdAt : earliest;
        }, null);

        return {
          piece,
          totalAmountWei: pieceBets.reduce((sum: bigint, bet: { amountWei: string }) => sum + BigInt(bet.amountWei), BigInt(0)).toString(),
          bettorCount: pieceBets.length,
          firstBetAt,
        };
      }),
    };
  }
}
