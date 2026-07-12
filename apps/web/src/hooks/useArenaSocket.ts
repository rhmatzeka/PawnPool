"use client";

import { useEffect } from 'react';
import { useArenaStore, TurnStatus } from '../stores/arena-store';

const API_URL = '/api';

export const useArenaSocket = () => {
  const { activeGameId, setGameState } = useArenaStore();

  const applyGameState = (game: any) => {
    let timeLeft = 20;
    if (game.turnEndsAt) {
      timeLeft = Math.max(0, Math.floor((new Date(game.turnEndsAt).getTime() - Date.now()) / 1000));
    }

    setGameState({
      activeGameId: game.gameId,
      status: game.status,
      result: game.result,
      fen: game.fen,
      currentTurn: game.currentTurn,
      turnNumber: game.turnNumber,
      turnStatus: game.turnStatus as TurnStatus,
      turnEndsAt: game.turnEndsAt,
      timeLeft,
      whitePoolWei: game.whitePoolWei,
      blackPoolWei: game.blackPoolWei,
      votes: game.votes,
      legalPieces: game.legalPieces || [],
    });
  };

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const res = await fetch(`${API_URL}/games/active`);
        if (!res.ok) throw new Error('Failed to fetch active game');
        const json = await res.json();
        
        if (json.ok && json.data) {
          applyGameState(json.data);
        }
      } catch (err) {
        console.error('Error fetching initial game state:', err);
      }
    };

    fetchInitialState();
  }, [setGameState]);

  useEffect(() => {
    if (!activeGameId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/games/${activeGameId}/state`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.ok && json.data) {
          applyGameState(json.data);
        }
      } catch (err) {
        if (!cancelled) console.error('Error polling game state:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeGameId, setGameState]);

  return { socket: null };
};
