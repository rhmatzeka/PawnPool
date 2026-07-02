"use client";

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useArenaStore, TurnStatus } from '../stores/arena-store';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const useArenaSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { activeGameId, setGameState, addMove } = useArenaStore();

  // 1. Fetch game state awal
  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const res = await fetch(`${API_URL}/games/active`);
        if (!res.ok) throw new Error('Failed to fetch active game');
        const json = await res.json();
        
        if (json.ok && json.data) {
          const game = json.data;
          
          // Hitung sisa waktu jika turn endsAt diset
          let initialTimeLeft = 20;
          if (game.turnEndsAt) {
            const diff = Math.max(0, Math.floor((new Date(game.turnEndsAt).getTime() - Date.now()) / 1000));
            initialTimeLeft = diff;
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
            timeLeft: initialTimeLeft,
            whitePoolWei: game.whitePoolWei,
            blackPoolWei: game.blackPoolWei,
            votes: game.votes,
          });
        }
      } catch (err) {
        console.error('Error fetching initial game state:', err);
      }
    };

    fetchInitialState();
  }, [setGameState]);

  // 2. Hubungkan ke WebSocket & tangani event-event realtime
  useEffect(() => {
    if (!activeGameId) return;

    // Connect ke namespace /arena
    const socket = io(`${SOCKET_URL}/arena`, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Join room arena
    socket.emit('arena:join', { gameId: activeGameId });

    socket.on('connect', () => {
      console.log('Connected to socket arena namespace');
    });

    socket.on('spectator:count', (data: { count: number }) => {
      setGameState({ spectatorCount: data.count });
    });

    socket.on('vote:updated', (data: { votes: any[] }) => {
      setGameState({ votes: data.votes });
    });

    socket.on('pool:updated', (data: { whitePoolWei: string; blackPoolWei: string }) => {
      setGameState({
        whitePoolWei: data.whitePoolWei,
        blackPoolWei: data.blackPoolWei,
      });
    });

    socket.on('turn:locked', () => {
      setGameState({ turnStatus: 'LOCKED', timeLeft: 0 });
    });

    socket.on('ai:thinking', () => {
      setGameState({ turnStatus: 'AI_THINKING' });
    });

    socket.on('piece:moving', (data: { piece: string; from: string; to: string; uci: string }) => {
      setGameState({ turnStatus: 'MOVING' });
      addMove({
        id: `move_${Date.now()}`,
        from: data.from,
        to: data.to,
        piece: data.piece,
        san: data.uci, // Gunakan uci sebagai fallback san
        turnNumber: useArenaStore.getState().turnNumber,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('piece:moved', (data: { fen: string }) => {
      setGameState({ fen: data.fen });
    });

    socket.on('turn:opened', (data: {
      turnNumber: number;
      currentTurn: 'WHITE' | 'BLACK';
      turnStatus: string;
      turnEndsAt: string;
    }) => {
      const diff = Math.max(0, Math.floor((new Date(data.turnEndsAt).getTime() - Date.now()) / 1000));
      setGameState({
        turnNumber: data.turnNumber,
        currentTurn: data.currentTurn,
        turnStatus: data.turnStatus as TurnStatus,
        turnEndsAt: data.turnEndsAt,
        timeLeft: diff,
      });
    });

    socket.on('game:ended', (data: { result: string; winner?: 'WHITE' | 'BLACK' | 'DRAW' }) => {
      setGameState({
        status: 'FINISHED',
        result: data.result,
        turnStatus: 'RESOLVED',
      });
    });

    return () => {
      socket.emit('arena:leave');
      socket.disconnect();
    };
  }, [activeGameId, setGameState, addMove]);

  return { socket: socketRef.current };
};
