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
                size={48} 
                className="drop-shadow-[0_3px_2px_rgba(0,0,0,0.45)] hover:scale-110 active:scale-95 duration-100" 
              />
            )}
          </ChessSquare>
        );
      }
    }
    
    return squares;
  };

  return (
    <div className="relative aspect-square w-full max-w-[min(576px,calc(100vh-220px))] overflow-hidden rounded-xl bg-[#2b1b12] shadow-2xl shadow-black/40 ring-4 ring-[#7a4c25]">
      <img
        src="/assets/chess/Board.png"
        alt="Chess board"
        draggable={false}
        className="absolute inset-0 h-full w-full select-none [image-rendering:pixelated]"
      />
      <div className="absolute inset-[6.25%] grid grid-cols-8 grid-rows-8">
        {renderSquares()}
      </div>
    </div>
  );
};
export default LiveChessBoard;
