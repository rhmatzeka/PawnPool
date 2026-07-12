"use client";

import React from 'react';
import { useArenaStore } from '../../stores/arena-store';
import ChessPieceSprite from './ChessPieceSprite';
import { coordsToSquare, squareToCoords } from '../../lib/chess-board';

export const LiveChessBoard: React.FC = () => {
  const { board } = useArenaStore();

  const renderPieces = () => {
    return Object.entries(board).flatMap(([square, piece]) => {
      if (!piece) return [];

      const { row, col } = squareToCoords(square);
      const squareSize = 100 / 8;
      const left = col * squareSize;
      const top = row * squareSize;

      return (
        <div
          key={square}
          className="absolute z-10 flex items-center justify-center"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${squareSize}%`,
            height: `${squareSize}%`,
          }}
        >
          <ChessPieceSprite
            piece={piece}
            size="78%"
            className="drop-shadow-[0_3px_2px_rgba(0,0,0,0.45)] hover:scale-110 active:scale-95 duration-100"
          />
        </div>
      );
    });
  };

  const renderSquares = () => {
    const squares = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = coordsToSquare(row, col);
        const isLight = (row + col) % 2 === 0;
        squares.push(
          <div
            key={square}
            className={`relative ${isLight ? 'bg-[#c89558]' : 'bg-[#6f3f28]'}`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-[length:12px_12px] opacity-60" />
            <div className="absolute inset-0 shadow-[inset_0_0_12px_rgba(0,0,0,0.12)]" />
          </div>
        );
      }
    }

    return squares;
  };

  return (
    <div className="relative aspect-square w-full max-w-[min(640px,calc(100vh-150px))] overflow-hidden rounded-2xl bg-[#2b1b12] p-3 shadow-2xl shadow-black/40 ring-4 ring-[#7a4c25]">
      <div className="absolute inset-3 grid grid-cols-8 grid-rows-8 overflow-hidden rounded-xl border border-[#d7a86a]/20 bg-[#2b1b12]">
        {renderSquares()}
      </div>
      <div className="pointer-events-none absolute inset-3 rounded-xl shadow-[inset_0_0_0_2px_rgba(255,230,180,0.08),inset_0_0_34px_rgba(0,0,0,0.34)]" />
      <div className="absolute inset-3">
        <div className="relative h-full w-full">
          {renderPieces()}
        </div>
      </div>
    </div>
  );
};
export default LiveChessBoard;
