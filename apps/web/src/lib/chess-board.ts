import { BoardState, ChessPiece, PieceType, Team, Square } from '../types/chess';

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const FEN_PIECE_MAP: Record<string, { type: PieceType; team: Team }> = {
  p: { type: 'PAWN', team: 'BLACK' },
  r: { type: 'ROOK', team: 'BLACK' },
  n: { type: 'KNIGHT', team: 'BLACK' },
  b: { type: 'BISHOP', team: 'BLACK' },
  q: { type: 'QUEEN', team: 'BLACK' },
  k: { type: 'KING', team: 'BLACK' },
  P: { type: 'PAWN', team: 'WHITE' },
  R: { type: 'ROOK', team: 'WHITE' },
  N: { type: 'KNIGHT', team: 'WHITE' },
  B: { type: 'BISHOP', team: 'WHITE' },
  Q: { type: 'QUEEN', team: 'WHITE' },
  K: { type: 'KING', team: 'WHITE' },
};

export function coordsToSquare(row: number, col: number): Square {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rank = 8 - row;
  return `${files[col]}${rank}`;
}

export function squareToCoords(square: Square): { row: number; col: number } {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const file = square[0];
  const rank = parseInt(square[1], 10);
  const col = files.indexOf(file);
  const row = 8 - rank;
  return { row, col };
}

export function parseFen(fen: string): BoardState {
  const board: BoardState = {};
  
  // Inisialisasi semua square kosong
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      board[coordsToSquare(r, c)] = null;
    }
  }

  const parts = fen.trim().split(/\s+/);
  const positionPart = parts[0];
  const rows = positionPart.split('/');

  for (let r = 0; r < 8; r++) {
    const rowStr = rows[r];
    let colIndex = 0;
    
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (/\d/.test(char)) {
        colIndex += parseInt(char, 10);
      } else {
        const pieceInfo = FEN_PIECE_MAP[char];
        if (pieceInfo) {
          const square = coordsToSquare(r, colIndex);
          board[square] = {
            type: pieceInfo.type,
            team: pieceInfo.team,
            id: `${pieceInfo.team}_${pieceInfo.type}_${square}`,
          };
        }
        colIndex++;
      }
    }
  }

  return board;
}
