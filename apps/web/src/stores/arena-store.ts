import { create } from 'zustand';
import { BoardState, Team, Move } from '../types/chess';
import { parseFen, INITIAL_FEN } from '../lib/chess-board';

export type TurnStatus =
  | 'OPEN'
  | 'WAITING_FOR_VOTE'
  | 'LOCKED'
  | 'AI_THINKING'
  | 'MOVING'
  | 'RESOLVED'
  | 'FAILED';

export interface VoteTally {
  piece: string;
  totalAmountWei: string;
  bettorCount: number;
  firstBetAt?: string | null;
}

interface ArenaState {
  activeGameId: string | null;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
  result: string | null;
  fen: string;
  board: BoardState;
  currentTurn: Team;
  turnNumber: number;
  turnStatus: TurnStatus;
  turnEndsAt: string | null;
  timeLeft: number;
  votes: VoteTally[];
  legalPieces: string[];
  myLockedTeam: Team | null;
  moveHistory: Move[];
  spectatorCount: number;
  rewardPoolWei: string;
  whitePoolWei: string;
  blackPoolWei: string;
  feeAmountWei: string;
  
  // Actions
  setGameState: (state: Partial<ArenaState>) => void;
  updateFen: (newFen: string) => void;
  addMove: (move: Move) => void;
}

export const useArenaStore = create<ArenaState>((set) => ({
  activeGameId: null,
  status: 'ACTIVE',
  result: null,
  fen: INITIAL_FEN,
  board: parseFen(INITIAL_FEN),
  currentTurn: 'WHITE',
  turnNumber: 1,
  turnStatus: 'OPEN',
  turnEndsAt: null,
  timeLeft: 20,
  votes: [
    { piece: 'PAWN', totalAmountWei: '0', bettorCount: 0 },
    { piece: 'KNIGHT', totalAmountWei: '0', bettorCount: 0 },
    { piece: 'BISHOP', totalAmountWei: '0', bettorCount: 0 },
    { piece: 'ROOK', totalAmountWei: '0', bettorCount: 0 },
    { piece: 'QUEEN', totalAmountWei: '0', bettorCount: 0 },
    { piece: 'KING', totalAmountWei: '0', bettorCount: 0 },
  ],
  legalPieces: ['PAWN', 'KNIGHT'],
  myLockedTeam: null,
  moveHistory: [],
  spectatorCount: 1,
  rewardPoolWei: '0',
  whitePoolWei: '0',
  blackPoolWei: '0',
  feeAmountWei: '0',

  setGameState: (newState) => set((state) => {
    // Jika FEN berubah, otomatis parse board-nya kembali
    if (newState.fen && newState.fen !== state.fen) {
      return {
        ...newState,
        board: parseFen(newState.fen),
      };
    }
    return newState;
  }),
  
  updateFen: (newFen) => set(() => ({
    fen: newFen,
    board: parseFen(newFen),
  })),

  addMove: (move) => set((state) => ({
    moveHistory: [...state.moveHistory, move],
  })),
}));
