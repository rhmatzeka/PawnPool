import { ChessStateService } from '../games/chess-state.service';
import { StockfishService } from './stockfish.service';
import { logger } from '../../shared/logger';

export interface MoveResolutionResult {
  from: string;
  to: string;
  uci: string;
  san: string;
  fenBefore: string;
  fenAfter: string;
}

export class MoveResolverService {
  /**
   * Menyelesaikan turn dengan mencari langkah terbaik berdasarkan winning piece
   */
  public static async resolveBestMoveForPiece(
    fen: string,
    team: 'WHITE' | 'BLACK',
    winningPiece: string,
    fallbackPieces: string[] = []
  ): Promise<MoveResolutionResult> {
    logger.info({ fen, team, winningPiece, fallbackPieces }, 'Resolving move for turn');

    // 1. Dapatkan legal moves untuk winning piece
    let targetPiece = winningPiece;
    let legalMoves = ChessStateService.getLegalMovesForPiece(fen, targetPiece, team);

    // 2. Jika tidak ada, cari di fallback pieces (voted pieces ranking berikutnya)
    if (legalMoves.length === 0) {
      for (const fallback of fallbackPieces) {
        logger.info({ fallback }, 'No legal moves for winning piece, trying fallback');
        legalMoves = ChessStateService.getLegalMovesForPiece(fen, fallback, team);
        if (legalMoves.length > 0) {
          targetPiece = fallback;
          break;
        }
      }
    }

    // 3. Jika masih tidak ada, fallback ke ALL legal moves untuk tim tersebut
    if (legalMoves.length === 0) {
      logger.info('No legal moves for voted/fallback pieces, falling back to all team moves');
      const allPieces = ['QUEEN', 'ROOK', 'BISHOP', 'KNIGHT', 'KING', 'PAWN'];
      for (const p of allPieces) {
        legalMoves = ChessStateService.getLegalMovesForPiece(fen, p, team);
        if (legalMoves.length > 0) {
          targetPiece = p;
          break;
        }
      }
    }

    if (legalMoves.length === 0) {
      throw new Error('NO_LEGAL_MOVES_AVAILABLE');
    }

    // 4. Minta Stockfish/AI menghitung langkah terbaik
    const bestMoveUci = await StockfishService.getBestMove(fen, legalMoves);
    const from = bestMoveUci.slice(0, 2);
    const to = bestMoveUci.slice(2, 4);

    // 5. Validasi dan apply ke chess.js untuk mendapatkan SAN & FEN baru
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
    };
  }
}
