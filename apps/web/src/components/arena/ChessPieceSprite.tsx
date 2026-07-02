import React from 'react';
import Image from 'next/image';
import { ChessPiece } from '../../types/chess';

interface ChessPieceSpriteProps {
  piece: ChessPiece;
  size?: number;
  className?: string;
}

export const PIECE_ASSET: Record<string, string> = {
  WHITE_PAWN: '/assets/chess/WhitePawn.png',
  WHITE_KNIGHT: '/assets/chess/WhiteKnight.png',
  WHITE_BISHOP: '/assets/chess/WhiteBishop.png',
  WHITE_ROOK: '/assets/chess/WhiteRook.png',
  WHITE_QUEEN: '/assets/chess/WhiteQueen.png',
  WHITE_KING: '/assets/chess/WhiteKing.png',
  BLACK_PAWN: '/assets/chess/BlackPawn.png',
  BLACK_KNIGHT: '/assets/chess/BlackKnight.png',
  BLACK_BISHOP: '/assets/chess/BlackBishop.png',
  BLACK_ROOK: '/assets/chess/BlackRook.png',
  BLACK_QUEEN: '/assets/chess/BlackQueen.png',
  BLACK_KING: '/assets/chess/BlackKing.png',
};

export const ChessPieceSprite: React.FC<ChessPieceSpriteProps> = ({
  piece,
  size = 48,
  className = '',
}) => {
  const assetKey = `${piece.team}_${piece.type}`;
  const src = PIECE_ASSET[assetKey];

  if (!src) {
    return <div className="text-xs text-red-500 font-bold">?</div>;
  }

  return (
    <div 
      className={`relative select-none pointer-events-none transition-transform duration-300 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={`${piece.team} ${piece.type}`}
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </div>
  );
};
export default ChessPieceSprite;
