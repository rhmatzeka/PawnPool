"use client";

import React from 'react';
import { useArenaStore } from '../../stores/arena-store';

export const MoveHistoryPanel: React.FC = () => {
  const { moveHistory } = useArenaStore();

  return (
    <div className="w-full bg-[#2d241e] p-3 rounded-xl border border-[#b58863]/30 shadow-md flex flex-col h-[120px] md:h-[150px]">
      <div className="border-b border-[#b58863]/10 pb-2 mb-2 flex justify-between items-center">
        <h3 className="text-xs font-bold text-[#eedcbf] uppercase tracking-wider">
          Move History
        </h3>
        <span className="text-[10px] text-[#eedcbf]/50 font-mono">
          {moveHistory.length} moves
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar text-xs">
        {moveHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#eedcbf]/30 italic text-[11px]">
            No moves recorded yet
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[#eedcbf]/70">
            {moveHistory.map((move, index) => {
              const turnNum = Math.floor(index / 2) + 1;
              const isWhite = index % 2 === 0;
              const moveText = `${move.piece.team === 'WHITE' ? 'White' : 'Black'}: ${move.piece.type} (${move.from} → ${move.to})`;

              return (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-[#b58863] text-[10px] w-6">{isWhite ? `${turnNum}.` : ''}</span>
                  <span className={isWhite ? 'text-white' : 'text-neutral-400'}>{moveText}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default MoveHistoryPanel;
