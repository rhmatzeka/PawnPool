"use client";

import React from 'react';
import { useArenaStore } from '../../stores/arena-store';

export const AiThinkingPanel: React.FC = () => {
  const { turnStatus } = useArenaStore();

  if (turnStatus !== 'AI_THINKING' && turnStatus !== 'LOCKED') return null;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-center items-center z-50 rounded-lg">
      <div className="bg-[#1e1713] p-6 rounded-2xl border border-[#b58863]/50 shadow-2xl flex flex-col items-center max-w-[280px]">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-[#b58863]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#eedcbf] animate-spin"></div>
        </div>
        <h4 className="text-sm font-bold text-[#eedcbf] uppercase tracking-wider mb-1 text-center animate-pulse">
          AI Thinking...
        </h4>
        <p className="text-[11px] text-[#eedcbf]/60 text-center">
          AI Agent is analyzing the board to calculate the best legal move for the winning piece.
        </p>
      </div>
    </div>
  );
};
export default AiThinkingPanel;
