"use client";

import React from 'react';
import { useArenaStore, VoteTally } from '../../stores/arena-store';
import { PieceType, Team } from '../../types/chess';
import Image from 'next/image';

const PIECE_PRICES: Record<PieceType, string> = {
  PAWN: '0.0001',
  KING: '0.0002',
  KNIGHT: '0.0003',
  BISHOP: '0.0003',
  ROOK: '0.0005',
  QUEEN: '0.0010',
};

const PIECE_NAMES: Record<PieceType, string> = {
  PAWN: 'Pawn',
  KING: 'King',
  KNIGHT: 'Knight',
  BISHOP: 'Bishop',
  ROOK: 'Rook',
  QUEEN: 'Queen',
};

export const VotingPanel: React.FC = () => {
  const { currentTurn, turnStatus, votes, setGameState, myLockedTeam } = useArenaStore();

  const handleVote = (piece: PieceType) => {
    if (turnStatus !== 'OPEN') return;
    
    // Lock team jika user belum punya locked team
    let finalTeam = myLockedTeam;
    if (!myLockedTeam) {
      finalTeam = currentTurn;
      setGameState({ myLockedTeam: currentTurn });
    }

    // Hanya boleh vote untuk current turn team
    if (finalTeam !== currentTurn) return;

    // Simulate voting update (MOCK MODE)
    const updatedVotes = votes.map((v) => {
      if (v.piece === piece) {
        const val = parseFloat(v.totalAmountWei) + parseFloat(PIECE_PRICES[piece]);
        return {
          ...v,
          totalAmountWei: val.toFixed(4),
          bettorCount: v.bettorCount + 1,
        };
      }
      return v;
    });

    setGameState({ votes: updatedVotes });
  };

  const getAssetPath = (piece: PieceType, team: Team) => {
    const formattedPiece = piece[0] + piece.slice(1).toLowerCase();
    const formattedTeam = team[0] + team.slice(1).toLowerCase();
    return `/assets/chess/${formattedTeam}${formattedPiece}.png`;
  };

  return (
    <div className="w-full bg-[#2d241e] p-6 rounded-xl border border-[#b58863]/30 shadow-md">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-[#eedcbf] uppercase tracking-wider mb-1">
          Place Your Bet
        </h3>
        <p className="text-xs text-[#eedcbf]/60">
          {myLockedTeam 
            ? `You are locked to ${myLockedTeam} team`
            : 'Your team will lock to the current turn on your first bet'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(Object.keys(PIECE_PRICES) as PieceType[]).map((piece) => {
          const price = PIECE_PRICES[piece];
          const name = PIECE_NAMES[piece];
          const voteData = votes.find((v) => v.piece === piece) || { totalAmountWei: '0', bettorCount: 0 };
          const imgUrl = getAssetPath(piece, currentTurn);
          const isDisabled = turnStatus !== 'OPEN' || !!(myLockedTeam && myLockedTeam !== currentTurn);

          return (
            <button
              key={piece}
              disabled={isDisabled}
              onClick={() => handleVote(piece)}
              className={`flex flex-col items-center justify-between p-3 rounded-lg border bg-[#1e1713] text-left transition-all duration-150 ${
                isDisabled 
                  ? 'opacity-40 cursor-not-allowed border-[#b58863]/10'
                  : 'hover:bg-[#251d18] border-[#b58863]/30 hover:border-[#b58863]/60 cursor-pointer active:scale-95'
              }`}
            >
              <div className="relative w-12 h-12 mb-2 select-none pointer-events-none">
                <Image
                  src={imgUrl}
                  alt={name}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="w-full text-center">
                <div className="text-xs font-bold text-[#eedcbf]">{name}</div>
                <div className="text-[10px] text-[#b58863] font-semibold">{price} ETH</div>
              </div>

              <div className="w-full border-t border-[#b58863]/10 mt-2 pt-1 flex justify-between text-[9px] text-[#eedcbf]/50 font-mono">
                <span>Pool: {voteData.totalAmountWei}</span>
                <span>Qty: {voteData.bettorCount}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default VotingPanel;
