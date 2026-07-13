"use client";

import React from 'react';
import { useArenaStore } from '../../stores/arena-store';

export const GameStatusPanel: React.FC = () => {
  const { currentTurn, turnNumber, status, result, spectatorCount } = useArenaStore();
  const statusLabel = status === 'ACTIVE' ? `Active (Turn ${turnNumber})` : result || status;

  return (
    <div className="w-full bg-[#2d241e] p-3 rounded-xl border border-[#b58863]/30 shadow-md flex flex-wrap justify-between items-center gap-2 text-sm md:p-3.5">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#eedcbf]/60 uppercase font-bold tracking-wider leading-none">
            Game Status
          </span>
          <span className="font-bold text-[#eedcbf] leading-tight">
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[#eedcbf]/60 uppercase font-bold tracking-wider leading-none">
            Next Turn
          </span>
          <span className={`font-bold mt-1 px-2.5 py-0.5 rounded text-xs ${
            currentTurn === 'WHITE' 
              ? 'bg-[#eedcbf] text-[#2d241e] border border-[#eedcbf]' 
              : 'bg-[#1e1713] text-[#eedcbf] border border-[#eedcbf]/30'
          }`}>
            {currentTurn}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[#eedcbf]/60 uppercase font-bold tracking-wider leading-none">
            Spectators
          </span>
          <span className="font-mono text-sm font-bold text-[#eedcbf]">
            {spectatorCount} Watching
          </span>
        </div>
      </div>
    </div>
  );
};
export default GameStatusPanel;
