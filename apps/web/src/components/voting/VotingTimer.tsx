"use client";

import React, { useEffect } from 'react';
import { useArenaStore } from '../../stores/arena-store';

export const VotingTimer: React.FC = () => {
  const { timeLeft, turnStatus, setGameState, currentTurn, turnEndsAt } = useArenaStore();

  useEffect(() => {
    if (turnStatus !== 'OPEN') return;

    const timer = setInterval(() => {
      if (turnEndsAt) {
        const diff = Math.max(0, Math.floor((new Date(turnEndsAt).getTime() - Date.now()) / 1000));
        setGameState({ timeLeft: diff });
      } else {
        if (timeLeft > 0) {
          setGameState({ timeLeft: timeLeft - 1 });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, turnStatus, setGameState, turnEndsAt]);

  const percentage = (timeLeft / 20) * 100;
  const isLowTime = timeLeft <= 5;

  return (
    <div className="w-full bg-[#2d241e] p-4 rounded-xl border border-[#b58863]/30 shadow-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-[#eedcbf]/60">
          Turn Status: <span className="text-[#eedcbf]">{turnStatus}</span>
        </span>
        <span className="text-xs font-bold text-[#eedcbf]/60 uppercase">
          Team: <span className={currentTurn === 'WHITE' ? 'text-white' : 'text-neutral-400'}>{currentTurn}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-[#1e1713] h-3 rounded-full overflow-hidden p-0.5 border border-[#b58863]/10">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              isLowTime ? 'bg-red-500 animate-pulse' : 'bg-[#b58863]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-lg font-mono font-bold leading-none w-8 text-right ${isLowTime ? 'text-red-500' : 'text-[#eedcbf]'}`}>
          {timeLeft}s
        </span>
      </div>
    </div>
  );
};
export default VotingTimer;
