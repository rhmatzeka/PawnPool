"use client";

import React from 'react';
import { useArenaStore } from '../../stores/arena-store';
import ChessPieceSprite from './ChessPieceSprite';
import { squareToCoords } from '../../lib/chess-board';

const PLAYABLE_AREA = {
  left: 5.9,
  top: 5.9,
  width: 88.9,
  height: 88.9,
};

export const LiveChessBoard: React.FC = () => {
  const { board } = useArenaStore();

  const renderPieces = () => {
    return Object.entries(board).flatMap(([square, piece]) => {
      if (!piece) return [];

      const { row, col } = squareToCoords(square);
      const squareWidth = 100 / 8;
      const squareHeight = 100 / 8;
      const left = col * squareWidth;
      const top = row * squareHeight;

      return (
        <div
          key={square}
          className="absolute z-10 flex items-center justify-center"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${squareWidth}%`,
            height: `${squareHeight}%`,
          }}
        >
          <ChessPieceSprite
            piece={piece}
            size="100%"
            className="drop-shadow-[0_3px_2px_rgba(0,0,0,0.45)] hover:scale-110 active:scale-95 duration-100"
          />
        </div>
      );
    });
  };

  return (
    <div className="relative aspect-square w-full max-w-[min(680px,calc(100vh-150px))] overflow-hidden rounded-2xl bg-[#2b1b12] p-3 shadow-2xl shadow-black/40 ring-4 ring-[#7a4c25]">
      <div className="absolute inset-3 overflow-hidden rounded-xl bg-[#8a5633]">
        <img
          src="/assets/chess/Board.png"
          alt="Chess board"
          draggable={false}
          className="absolute select-none [image-rendering:pixelated]"
          style={{
            left: `-${(PLAYABLE_AREA.left / PLAYABLE_AREA.width) * 100}%`,
            top: `-${(PLAYABLE_AREA.top / PLAYABLE_AREA.height) * 100}%`,
            width: `${(100 / PLAYABLE_AREA.width) * 100}%`,
            height: `${(100 / PLAYABLE_AREA.height) * 100}%`,
          }}
        />
      </div>
      <div className="pointer-events-none absolute inset-3 rounded-xl shadow-[inset_0_0_0_2px_rgba(255,230,180,0.08),inset_0_0_32px_rgba(0,0,0,0.28)]" />
      <div className="absolute inset-3">
        <div className="relative h-full w-full">
        {renderPieces()}
        </div>
      </div>
    </div>
  );
};
export default LiveChessBoard;
