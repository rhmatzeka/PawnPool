import { prisma } from '../../shared/prisma';
import { ChessStateService } from './chess-state.service';
import { SocketServer } from '../realtime/socket.server';
import { logger } from '../../shared/logger';
import { INITIAL_FEN, MAX_HALF_MOVES, MAX_NO_VOTE_REOPEN, PIECE_PRIORITY, VOTING_DURATION_SECONDS } from '../../shared/constants';
import { MoveResolverService } from '../ai/move-resolver.service';

const TURN_DURATION_MS = VOTING_DURATION_SECONDS * 1000;

function addWei(a: string, b: string) {
  return (BigInt(a) + BigInt(b)).toString();
}

export class GamesService {
  /**
   * Membuat game baru
   */
  public static async createGame() {
    const gameId = `game_${Date.now()}`;
    const chainGameId = String(Date.now());

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

    // Buat initial turn
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

    return game;
  }

  /**
   * Mengambil game aktif terakhir atau membuat baru jika belum ada
   */
  public static async getActiveGameOrCreate() {
    let game = await prisma.game.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!game) {
      game = await this.createGame();
    }

    return game;
  }

  /**
   * Ambil state game terlengkap
   */
  public static async getGameState(gameId: string) {
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

    const currentTurnObj = game.turns[0];
    const bets = await prisma.bet.findMany({
      where: {
        gameId,
        turnNumber: game.turnNumber,
        status: 'CONFIRMED_VALID',
      },
    });

    const voteTalies = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'].map((p) => {
      const pieceBets = bets.filter((b: any) => b.piece === p);
      const totalAmountWei = pieceBets
        .reduce((sum: bigint, b: any) => sum + BigInt(b.amountWei), 0n)
        .toString();

      const firstBetAt = pieceBets.reduce<string | null>((earliest: string | null, b: any) => {
        const createdAt = b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt);
        return !earliest || createdAt < earliest ? createdAt : earliest;
      }, null);

      return {
        piece: p,
        totalAmountWei,
        bettorCount: pieceBets.length,
        firstBetAt,
      };
    });

    return {
      gameId: game.id,
      chainGameId: game.chainGameId,
      status: game.status,
      result: game.result,
      fen: game.currentFen,
      currentTurn: game.currentTurn,
      turnNumber: game.turnNumber,
      turnStatus: game.turnStatus,
      turnEndsAt: currentTurnObj?.endsAt || null,
      whitePoolWei: game.whitePoolWei,
      blackPoolWei: game.blackPoolWei,
      votes: voteTalies,
    };
  }

  /**
   * Vote bet mock (tanpa blockchain write)
   */
  public static async placeBetMock(
    gameId: string,
    address: string,
    team: 'WHITE' | 'BLACK',
    piece: string,
    amountWei: string
  ) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || game.status !== 'ACTIVE') {
      throw new Error('GAME_NOT_ACTIVE');
    }

    if (game.turnStatus !== 'OPEN') {
      throw new Error('TURN_LOCKED');
    }

    if (team !== game.currentTurn) {
      throw new Error('WRONG_TEAM_TURN');
    }

    // Cek team lock
    const existingLock = await prisma.playerGameState.findUnique({
      where: {
        gameId_address: { gameId, address },
      },
    });

    if (existingLock && existingLock.lockedTeam !== team) {
      throw new Error('TEAM_ALREADY_LOCKED');
    }

    if (!existingLock) {
      await prisma.playerGameState.create({
        data: {
          gameId,
          userId: address, // user id dummy untuk mock
          address,
          lockedTeam: team,
        },
      });
    }

    // Cek double bet per turn
    const doubleBet = await prisma.bet.findFirst({
      where: {
        gameId,
        turnNumber: game.turnNumber,
        address,
      },
    });

    if (doubleBet) {
      throw new Error('ALREADY_BET_THIS_TURN');
    }

    // Simulate bet record
    const user = await prisma.user.upsert({
      where: { address },
      create: { address },
      update: {},
    });

    const txHash = `mock_tx_${Date.now()}_${Math.random()}`;

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
        txHash,
      },
    });

    // Update pool
    const newPool = team === 'WHITE'
      ? { whitePoolWei: addWei(game.whitePoolWei, amountWei) }
      : { blackPoolWei: addWei(game.blackPoolWei, amountWei) };

    await prisma.game.update({
      where: { id: gameId },
      data: newPool,
    });

    // Broadcast vote update
    const updatedState = await this.getGameState(gameId);
    if (updatedState) {
      const io = SocketServer.getInstance();
      io.of('/arena').to(`arena:${gameId}`).emit('vote:updated', {
        gameId,
        turnNumber: game.turnNumber,
        team,
        votes: updatedState.votes,
      });
      io.of('/arena').to(`arena:${gameId}`).emit('pool:updated', {
        gameId,
        whitePoolWei: updatedState.whitePoolWei,
        blackPoolWei: updatedState.blackPoolWei,
      });
    }

    return bet;
  }

  /**
   * Menjelaskan turn resolution lokal (MOCK MODE)
   */
  public static async resolveTurnMock(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        turns: {
          orderBy: { turnNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!game || game.status !== 'ACTIVE' || game.turnStatus !== 'OPEN') {
      return null;
    }

    const currentTurnObj = game.turns[0];
    const io = SocketServer.getInstance();
    const arenaNs = io.of('/arena').to(`arena:${gameId}`);

    // Lock turn di DB
    await prisma.game.update({
      where: { id: gameId },
      data: { turnStatus: 'LOCKED' },
    });
    
    arenaNs.emit('turn:locked', { gameId, turnNumber: game.turnNumber });

    // Hitung votes
    const votesTally = await this.getGameState(gameId);
    const validVotes = votesTally?.votes.filter((v) => BigInt(v.totalAmountWei) > 0n) || [];

    // TIE BREAK & WINNING PIECE DETERMINATION
    let winningPiece = '';
    let fallbackPieces: string[] = [];

    if (validVotes.length > 0) {
      // Deterministic tie-break: amount desc, bettor count desc, earliest bet, piece priority.
      const sorted = [...validVotes].sort((a, b) => {
        const amtA = BigInt(a.totalAmountWei);
        const amtB = BigInt(b.totalAmountWei);
        if (amtB !== amtA) return amtB > amtA ? 1 : -1;
        if (b.bettorCount !== a.bettorCount) return b.bettorCount - a.bettorCount;
        if (a.firstBetAt && b.firstBetAt && a.firstBetAt !== b.firstBetAt) {
          return a.firstBetAt < b.firstBetAt ? -1 : 1;
        }
        return PIECE_PRIORITY.indexOf(a.piece as any) - PIECE_PRIORITY.indexOf(b.piece as any);
      });
      
      winningPiece = sorted[0].piece;
      fallbackPieces = sorted.slice(1).map((s) => s.piece);
    }

    // NO VOTE HANDLING
    if (!winningPiece) {
      const currentReopens = currentTurnObj.voteReopenCount;
      if (currentReopens < MAX_NO_VOTE_REOPEN) {
        await prisma.game.update({
          where: { id: gameId },
          data: { turnStatus: 'WAITING_FOR_VOTE', noVoteCount: game.noVoteCount + 1 },
        });

        arenaNs.emit('turn:opened', {
          gameId,
          turnNumber: game.turnNumber,
          currentTurn: game.currentTurn,
          turnStatus: 'WAITING_FOR_VOTE',
          turnEndsAt: null,
          message: `Menunggu vote dari team ${game.currentTurn}`,
        });

        // Reopen turn
        const newEndsAt = new Date(Date.now() + TURN_DURATION_MS);
        await prisma.turn.update({
          where: { id: currentTurnObj.id },
          data: {
            voteReopenCount: currentReopens + 1,
            endsAt: newEndsAt,
            status: 'OPEN',
          },
        });

        await prisma.game.update({
          where: { id: gameId },
          data: { turnStatus: 'OPEN' },
        });

        arenaNs.emit('turn:opened', {
          gameId,
          turnNumber: game.turnNumber,
          currentTurn: game.currentTurn,
          turnStatus: 'OPEN',
          turnEndsAt: newEndsAt.toISOString(),
          message: `Menunggu vote dari team ${game.currentTurn} (reopened ${currentReopens + 1}/${MAX_NO_VOTE_REOPEN})`,
        });

        return { status: 'REOPENED' };
      } else {
        // Auto cancel game
        await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'CANCELLED',
            result: 'CANCELLED',
            turnStatus: 'FAILED',
          },
        });

        arenaNs.emit('game:ended', {
          gameId,
          result: 'CANCELLED',
          message: 'Game cancelled karena tidak ada vote selama 3 kali reopen. Refund 100% aktif.',
        });

        return { status: 'CANCELLED' };
      }
    }

    // JIKA ADA VOTE, JALANKAN AI RESOLUTION
    arenaNs.emit('ai:thinking', { gameId, turnNumber: game.turnNumber });

    try {
      const resolution = await MoveResolverService.resolveBestMoveForPiece(
        game.currentFen,
        game.currentTurn as any,
        winningPiece,
        fallbackPieces
      );

      // Simpan move ke DB
      await prisma.move.create({
        data: {
          gameId,
          turnNumber: game.turnNumber,
          fromSquare: resolution.from,
          toSquare: resolution.to,
          piece: `${game.currentTurn}_${winningPiece}`,
          san: resolution.san,
          uci: resolution.uci,
          fenBefore: resolution.fenBefore,
          fenAfter: resolution.fenAfter,
        },
      });

      // Update turn record
      await prisma.turn.update({
        where: { id: currentTurnObj.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          lockedAt: new Date(),
          winningPiece,
        },
      });

      // Broadcast move animation ke client
      arenaNs.emit('piece:moving', {
        gameId,
        turnNumber: game.turnNumber,
        piece: `${game.currentTurn}_${winningPiece}`,
        from: resolution.from,
        to: resolution.to,
        uci: resolution.uci,
        durationMs: 800,
      });

      // Tunggu animasi selesai di client
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Periksa game result
      const gameCheck = ChessStateService.checkGameResult(resolution.fenAfter);
      const nextTurnTeam = game.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE';
      const nextTurnNumber = game.turnNumber + 1;

      if (nextTurnNumber > MAX_HALF_MOVES && !gameCheck.isGameOver) {
        gameCheck.isGameOver = true;
        gameCheck.result = 'DRAW';
      }

      if (gameCheck.isGameOver && gameCheck.result) {
        // Game Over
        await prisma.game.update({
          where: { id: gameId },
          data: {
            currentFen: resolution.fenAfter,
            status: 'FINISHED',
            result: gameCheck.result,
            winner: gameCheck.result === 'DRAW' ? 'DRAW' : (gameCheck.result === 'WHITE_WIN' ? 'WHITE' : 'BLACK'),
            turnStatus: 'RESOLVED',
          },
        });

        arenaNs.emit('piece:moved', {
          gameId,
          fen: resolution.fenAfter,
        });

        arenaNs.emit('game:ended', {
          gameId,
          result: gameCheck.result,
          winner: gameCheck.result === 'DRAW' ? 'DRAW' : (gameCheck.result === 'WHITE_WIN' ? 'WHITE' : 'BLACK'),
        });

        return { status: 'FINISHED', result: gameCheck.result };
      } else {
        // Game lanjut ke turn berikutnya
        await prisma.game.update({
          where: { id: gameId },
          data: {
            currentFen: resolution.fenAfter,
            currentTurn: nextTurnTeam,
            turnNumber: nextTurnNumber,
            turnStatus: 'OPEN',
          },
        });

        const newEndsAt = new Date(Date.now() + TURN_DURATION_MS);
        await prisma.turn.create({
          data: {
            gameId,
            turnNumber: nextTurnNumber,
            team: nextTurnTeam,
            status: 'OPEN',
            openedAt: new Date(),
            endsAt: newEndsAt,
          },
        });

        arenaNs.emit('piece:moved', {
          gameId,
          fen: resolution.fenAfter,
        });

        arenaNs.emit('turn:opened', {
          gameId,
          turnNumber: nextTurnNumber,
          currentTurn: nextTurnTeam,
          turnStatus: 'OPEN',
          turnEndsAt: newEndsAt.toISOString(),
        });

        return { status: 'NEXT_TURN', turnNumber: nextTurnNumber };
      }
    } catch (err: any) {
      logger.error(err, 'AI resolution failed for turn');
      
      // Fallback: reopen turn yang sama
      await prisma.game.update({
        where: { id: gameId },
        data: { turnStatus: 'OPEN' },
      });

      arenaNs.emit('turn:opened', {
        gameId,
        turnNumber: game.turnNumber,
        currentTurn: game.currentTurn,
        turnStatus: 'OPEN',
        turnEndsAt: new Date(Date.now() + TURN_DURATION_MS).toISOString(),
        message: 'AI Resolution failed. Reopening turn for retry.',
      });

      return { status: 'FAILED' };
    }
  }
}
