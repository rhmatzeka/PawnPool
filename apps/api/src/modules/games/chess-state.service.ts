import { Chess } from 'chess.js';

export class ChessStateService {
  /**
   * Mendapatkan semua legal moves yang difilter berdasarkan tipe piece
   */
  public static getLegalMovesForPiece(
    fen: string,
    pieceType: string,
    team: string
  ): string[] {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    
    const teamCode = team === 'WHITE' ? 'w' : 'b';
    const pieceCode = pieceType === 'KNIGHT' ? 'n' : pieceType[0].toLowerCase();

    return moves
      .filter((m) => m.color === teamCode && m.piece === pieceCode)
      .map((m) => `${m.from}${m.to}`);
  }

  /**
   * Validasi move berdasarkan FEN awal
   */
  public static validateMove(
    fen: string,
    from: string,
    to: string
  ): { isValid: boolean; san?: string; fenAfter?: string } {
    const chess = new Chess(fen);
    try {
      const move = chess.move({ from, to, promotion: 'q' });
      return {
        isValid: true,
        san: move.san,
        fenAfter: chess.fen(),
      };
    } catch (e) {
      return { isValid: false };
    }
  }

  /**
   * Memeriksa status akhir game (checkmate, draw, stalemate)
   */
  public static checkGameResult(fen: string): {
    isGameOver: boolean;
    result?: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | null;
  } {
    const chess = new Chess(fen);
    
    if (!chess.isGameOver()) {
      return { isGameOver: false };
    }

    if (chess.isCheckmate()) {
      // Jika giliran putih yang jalan saat checkmate, berarti hitam yang menang (karena putih tidak ada move & rajanya diserang)
      const winner = chess.turn() === 'w' ? 'BLACK_WIN' : 'WHITE_WIN';
      return { isGameOver: true, result: winner };
    }

    if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      return { isGameOver: true, result: 'DRAW' };
    }

    return { isGameOver: true, result: 'DRAW' };
  }
}
