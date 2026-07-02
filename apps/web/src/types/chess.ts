export type Team = 'WHITE' | 'BLACK';

export type PieceType = 'PAWN' | 'KNIGHT' | 'BISHOP' | 'ROOK' | 'QUEEN' | 'KING';

export interface ChessPiece {
  type: PieceType;
  team: Team;
  id: string; // unique id untuk render list key & animasi smooth
}

export type Square = string; // e.g., 'a1', 'e4'

export type BoardState = Record<Square, ChessPiece | null>;

export interface Move {
  from: Square;
  to: Square;
  piece: ChessPiece;
  san?: string;
}
