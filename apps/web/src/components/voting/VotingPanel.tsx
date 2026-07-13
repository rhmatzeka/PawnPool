"use client";

import React, { useState } from 'react';
import { useArenaStore, VoteTally } from '../../stores/arena-store';
import { PieceType, Team } from '../../types/chess';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { usePlaceBet } from '../../hooks/usePlaceBet';
import { parseEther } from 'viem';
import { CHAIN_ID, PIECE_PRICES } from 'shared';

const PIECE_NAMES: Record<PieceType, string> = {
  PAWN: 'Pawn',
  KING: 'King',
  KNIGHT: 'Knight',
  BISHOP: 'Bishop',
  ROOK: 'Rook',
  QUEEN: 'Queen',
};

const API_URL = '/api';
const MOCK_CHAIN = process.env.NEXT_PUBLIC_ENABLE_ONCHAIN_BETS !== 'true';

function formatEthFromWei(wei: string) {
  const eth = Number(BigInt(wei)) / 1e18;
  if (eth === 0) return '0 ETH';
  return `${eth.toFixed(4)} ETH`;
}

export const VotingPanel: React.FC = () => {
  const {
    activeGameId,
    turnNumber,
    currentTurn,
    turnStatus,
    votes,
    legalPieces,
    setGameState,
    myLockedTeam,
  } = useArenaStore();

  const { address, chainId, isConnected } = useAccount();
  const { placeBet, isPending, isConfirming } = usePlaceBet();
  const [isVotingLoading, setIsVotingLoading] = useState(false);
  const [myPickedPiece, setMyPickedPiece] = useState<PieceType | null>(null);
  const maxVoteWei = votes.reduce((max, vote) => {
    const amount = BigInt(vote.totalAmountWei);
    return amount > max ? amount : max;
  }, BigInt(0));

  const handleVote = async (piece: PieceType) => {
    if (turnStatus !== 'OPEN' || !activeGameId) return;
    
    // User wajib memilih tim terlebih dahulu sebelum bet
    if (!myLockedTeam) {
      alert('Please select your team first!');
      return;
    }

    // Hanya boleh vote untuk current turn team
    if (myLockedTeam !== currentTurn) return;

    if (!legalPieces.includes(piece)) {
      alert(`${PIECE_NAMES[piece]} cannot move in the current position. Choose a highlighted legal piece.`);
      return;
    }

    if (!MOCK_CHAIN && isConnected && address && chainId === CHAIN_ID) {
      // ON-CHAIN VOTE VIA WALLET
      try {
        await placeBet(activeGameId, turnNumber, currentTurn, piece);
      } catch (err) {
        console.error('On-chain bet failed:', err);
      }
    } else {
      // OFF-CHAIN MOCK VOTE (FALLBACK)
      setIsVotingLoading(true);
      try {
        // Use the connected wallet for demo-mode identity when available.
        let mockAddress = address || localStorage.getItem('pawn_pool_mock_address');
        if (!mockAddress) {
          mockAddress = `0xmock_user_${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;
          localStorage.setItem('pawn_pool_mock_address', mockAddress);
        }

        const priceEth = PIECE_PRICES[piece];
        const amountWei = parseEther(priceEth).toString();

        const res = await fetch(`${API_URL}/games/${activeGameId}/votes/mock-bet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: mockAddress,
            team: currentTurn,
            piece,
            amountWei,
          }),
        });

        if (!res.ok) {
          const errorJson = await res.json();
          throw new Error(errorJson.error?.message || 'Failed to submit mock bet');
        }

        // Mock state feedback instan
        const updatedVotes = votes.map((v) => {
          if (v.piece === piece) {
            const val = BigInt(v.totalAmountWei) + parseEther(priceEth);
            return {
              ...v,
              totalAmountWei: val.toString(),
              bettorCount: v.bettorCount + 1,
            };
          }
          return v;
        });

        setGameState({ votes: updatedVotes });
        setMyPickedPiece(piece);
      } catch (err) {
        console.error('Mock bet submission failed:', err);
        alert(err instanceof Error ? err.message : 'Failed to submit bet');
      } finally {
        setIsVotingLoading(false);
      }
    }
  };

  const getAssetPath = (piece: PieceType, team: Team) => {
    const formattedPiece = piece[0] + piece.slice(1).toLowerCase();
    const formattedTeam = team[0] + team.slice(1).toLowerCase();
    return `/assets/chess/${formattedTeam}${formattedPiece}.png`;
  };

  const handleSelectTeam = (team: Team) => {
    setGameState({ myLockedTeam: team });
    localStorage.setItem(`chessstake_locked_team_${activeGameId}`, team);
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'team_selected', gameId: activeGameId, payload: { team } }),
    }).catch(() => undefined);
  };

  // Efek samping untuk me-restore team dari localStorage jika ada
  React.useEffect(() => {
    if (activeGameId) {
      const storedTeam = localStorage.getItem(`chessstake_locked_team_${activeGameId}`);
      if (storedTeam === 'WHITE' || storedTeam === 'BLACK') {
        setGameState({ myLockedTeam: storedTeam as Team });
      }
    }
  }, [activeGameId, setGameState]);

  return (
    <div className="w-full bg-[#2d241e] p-3 rounded-xl border border-[#b58863]/30 shadow-md flex flex-col gap-3 md:p-4">
      {/* Team Selection Section */}
      <div className="border-b border-[#b58863]/20 pb-3">
        <h3 className="text-xs font-bold text-[#eedcbf] uppercase tracking-wider mb-2">
          Select Your Team
        </h3>
        
        {!myLockedTeam ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSelectTeam('WHITE')}
              className="py-2 px-3 rounded-lg font-bold text-center border transition-all duration-150 cursor-pointer text-[#1e1713] bg-[#eedcbf] border-[#eedcbf] hover:bg-[#eedcbf]/90 active:scale-95"
            >
              WHITE Team
            </button>
            <button
              onClick={() => handleSelectTeam('BLACK')}
              className="py-2 px-3 rounded-lg font-bold text-center border transition-all duration-150 cursor-pointer text-[#eedcbf] bg-[#1e1713] border-[#eedcbf]/30 hover:bg-[#1e1713]/80 active:scale-95"
            >
              BLACK Team
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-[#1e1713] px-3 py-2 rounded-lg border border-[#b58863]/20">
            <span className="text-xs text-[#eedcbf]/60 font-semibold">Joined Team:</span>
            <span className={`font-extrabold text-sm px-3 py-1 rounded ${
              myLockedTeam === 'WHITE' 
                ? 'bg-[#eedcbf] text-[#1e1713]' 
                : 'bg-[#2d241e] text-neutral-300 border border-neutral-700'
            }`}>
              {myLockedTeam}
            </span>
          </div>
        )}
      </div>

      <div>
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-[#eedcbf] uppercase tracking-wider">
              Back This Turn
            </h3>
          </div>
          <p className="text-xs text-[#eedcbf]/60">
            {!myLockedTeam 
              ? 'Select your team above to unlock betting.'
              : myLockedTeam !== currentTurn
                ? `Waiting for your team's turn (${myLockedTeam}). Currently it's ${currentTurn}'s turn.`
                : 'Back the piece you believe should move next. The highest-backed legal piece controls this turn.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(PIECE_PRICES) as PieceType[]).map((piece) => {
            const price = PIECE_PRICES[piece];
            const name = PIECE_NAMES[piece];
            const voteData = votes.find((v) => v.piece === piece) || { totalAmountWei: '0', bettorCount: 0 };
            const imgUrl = getAssetPath(piece, currentTurn);
            const isBusy = isPending || isConfirming || isVotingLoading;
            const isWrongChain = !MOCK_CHAIN && isConnected && chainId !== CHAIN_ID;
            const hasLegalMove = legalPieces.includes(piece);
            const isDisabled = !myLockedTeam || turnStatus !== 'OPEN' || isBusy || myLockedTeam !== currentTurn || !hasLegalMove || isWrongChain || (!MOCK_CHAIN && !isConnected);
            const voteWei = BigInt(voteData.totalAmountWei);
            const progress = maxVoteWei > BigInt(0) ? Number((voteWei * BigInt(100)) / maxVoteWei) : 0;
            const isLeading = maxVoteWei > BigInt(0) && voteWei === maxVoteWei;
            const isMyPick = myPickedPiece === piece;

            return (
              <button
                key={piece}
                disabled={isDisabled}
                onClick={() => handleVote(piece)}
                className={`flex flex-col items-center justify-between p-3 rounded-lg border bg-[#1e1713] text-left transition-all duration-150 relative ${
                  isDisabled 
                    ? 'opacity-30 cursor-not-allowed border-[#b58863]/10'
                    : 'hover:bg-[#251d18] border-[#b58863]/30 hover:border-[#b58863]/60 cursor-pointer active:scale-95'
                } p-2`}
              >
                <div className="absolute left-2 top-2 flex gap-1">
                  {isLeading && <span className="rounded bg-[#d6a15f] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#1e1713]">Leading</span>}
                  {isMyPick && <span className="rounded border border-[#d6a15f]/40 px-1.5 py-0.5 text-[9px] font-black uppercase text-[#d6a15f]">Your Pick</span>}
                </div>
                <div className="relative w-9 h-9 mb-1.5 select-none pointer-events-none md:h-11 md:w-11">
                  <Image
                    src={imgUrl}
                    alt={name}
                    fill
                    className="object-contain [image-rendering:pixelated]"
                    priority
                  />
                </div>

                <div className="w-full text-center">
                  <div className="text-[11px] font-bold text-[#eedcbf] md:text-xs">{name}</div>
                  <div className="text-[10px] text-[#b58863] font-semibold">
                    {!hasLegalMove ? 'No legal move' : isWrongChain ? 'Switch to Ethereum Sepolia' : isBusy ? 'Submitting...' : `${price} ETH`}
                  </div>
                </div>

                <div className="w-full border-t border-[#b58863]/10 mt-1.5 pt-1 flex justify-between text-[8px] text-[#eedcbf]/50 font-mono md:text-[9px]">
                  <span>{formatEthFromWei(voteData.totalAmountWei)}</span>
                  <span>{voteData.bettorCount} backers</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#120d0a]">
                  <div className="h-full bg-[#d6a15f]" style={{ width: `${progress}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default VotingPanel;
