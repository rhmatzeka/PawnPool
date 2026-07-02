export const CHAIN_ID = 84532;
export const CHAIN_NAME = 'Base Sepolia';
export const VOTING_DURATION_SECONDS = 20;
export const MAX_NO_VOTE_REOPEN = 3;
export const MAX_HALF_MOVES = 120;
export const PLATFORM_FEE_BPS = 1000;
export const BPS_DENOMINATOR = 10000;
export const STOCKFISH_TIMEOUT_MS = 5000;
export const AI_MAX_RETRY = 2;
export const PIECE_MOVE_ANIMATION_MS = 800;
export const INDEXER_CONFIRMATION_DELAY_BLOCKS = 2;

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const PIECE_PRICES: Record<string, string> = {
  PAWN: '0.0001',
  KING: '0.0002',
  KNIGHT: '0.0003',
  BISHOP: '0.0003',
  ROOK: '0.0005',
  QUEEN: '0.0010',
};
