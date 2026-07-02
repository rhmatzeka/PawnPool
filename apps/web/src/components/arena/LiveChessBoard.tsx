"use client";

import React from 'react';
import { useArenaStore } from '../../stores/arena-store';
import ChessSquare from './ChessSquare';
import ChessPieceSprite from './ChessPieceSprite';
import { coordsToSquare } from '../../lib/chess-board';

export const LiveChessBoard: React.FC = () => {
  const { board } = useArenaStore();

  const renderSquares = () => {
    const squares = [];
    
    // Board standard: White perspective
    // Row 0 = rank 8, Row 7 = rank 1
    // Col 0 = file a, Col 7 = file h
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const square = coordsToSquare(r, c);
        const piece = board[square];
        const isLight = (r + c) % 2 === 0;

        squares.push(
          <ChessSquare key={square} square={square} isLight={isLight}>
            {piece && (
              <ChessPieceSprite 
                piece={piece} 
                size={52} 
                className="hover:scale-105 active:scale-95 duration-100" 
              />
            )}
          </ChessSquare>
        );
      }
    }
    
    return squares;
  };

  return (
    <div className="relative w-full max-w-[500px] aspect-square rounded-lg overflow-hidden shadow-2xl border-4 border-[#8b5a2b] bg-[#8b5a2b]">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {renderSquares()}
      </div>
    </div>
  );
};
export default LiveChessBoard;
