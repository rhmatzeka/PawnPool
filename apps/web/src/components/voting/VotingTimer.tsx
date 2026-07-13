"use client";

import React, { useEffect, useRef } from 'react';
import { useArenaStore } from '../../stores/arena-store';

const API_URL = '/api';

export const VotingTimer: React.FC = () => {
  const { activeGameId, timeLeft, turnNumber, turnStatus, setGameState, currentTurn, turnEndsAt } = useArenaStore();
  const resolvedTurnRef = useRef<string | null>(null);

  const syncGameState = async (gameId: string) => {
    const res = await fetch(`${API_URL}/games/${gameId}/state`, {
      cache: 'no-store',
    });

    if (!res.ok) return;

    const json = await res.json();
    if (!json.ok || !json.data) return;

    const game = json.data;
    const nextTimeLeft = game.turnEndsAt
      ? Math.max(0, Math.floor((new Date(game.turnEndsAt).getTime() - Date.now()) / 1000))
      : 0;

    setGameState({
      activeGameId: game.gameId,
      status: game.status,
      result: game.result,
      fen: game.fen,
      currentTurn: game.currentTurn,
      turnNumber: game.turnNumber,
      turnStatus: game.turnStatus,
      turnEndsAt: game.turnEndsAt,
      timeLeft: nextTimeLeft,
      whitePoolWei: game.whitePoolWei,
      blackPoolWei: game.blackPoolWei,
      votes: game.votes,
    });
  };

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

  useEffect(() => {
    if (!activeGameId || turnStatus !== 'OPEN' || timeLeft !== 0) return;

    const resolveKey = `${activeGameId}:${turnNumber}`;
    if (resolvedTurnRef.current === resolveKey) return;

    resolvedTurnRef.current = resolveKey;

    let cancelled = false;
    setGameState({ turnStatus: 'LOCKED', timeLeft: 0 });

    const resolveExpiredTurn = async () => {
      try {
        const res = await fetch(`${API_URL}/games/${activeGameId}/resolve-expired-turn`, {
          method: 'POST',
        });

        if (!res.ok && !cancelled) {
          const json = await res.json().catch(() => null);
          console.error('Failed to resolve expired turn:', json?.error?.message || res.statusText);
        }

        if (!cancelled) {
          setGameState({ turnStatus: 'AI_THINKING' });
        }

        const delays = [750, 1800, 3500, 6000];
        for (const delay of delays) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          if (cancelled) return;
          await syncGameState(activeGameId);

          const state = useArenaStore.getState();
          if (state.turnNumber !== turnNumber || state.turnStatus !== 'OPEN') {
            return;
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to resolve expired turn:', err);
          setGameState({ turnStatus: 'FAILED' });
        }
      }
    };

    resolveExpiredTurn();

    return () => {
      cancelled = true;
    };
  }, [activeGameId, timeLeft, turnNumber, turnStatus]);

  const percentage = (timeLeft / 20) * 100;
  const isLowTime = timeLeft <= 5;

  return (
    <div className="w-full bg-[#2d241e] p-3 rounded-xl border border-[#b58863]/30 shadow-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-[#eedcbf]/60">
          Turn Status: <span className="text-[#eedcbf]">{turnStatus}</span>
        </span>
        <span className="text-xs font-bold text-[#eedcbf]/60 uppercase">
          Team: <span className={currentTurn === 'WHITE' ? 'text-white' : 'text-neutral-400'}>{currentTurn}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-[#1e1713] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#b58863]/10">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              isLowTime ? 'bg-red-500 animate-pulse' : 'bg-[#b58863]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-base font-mono font-bold leading-none w-8 text-right ${isLowTime ? 'text-red-500' : 'text-[#eedcbf]'}`}>
          {timeLeft}s
        </span>
      </div>
    </div>
  );
};
export default VotingTimer;
