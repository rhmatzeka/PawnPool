"use client";

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PawnPoolABI, CHAIN_ID, PIECE_PRICES } from 'shared';
import { parseEther } from 'viem';
import { Team, PieceType } from '../types/chess';

// Address Base Sepolia dummy/placeholder
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';

export function usePlaceBet() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const placeBet = async (
    gameId: string,
    turnNumber: number,
    team: Team,
    piece: PieceType
  ) => {
    const teamNum = team === 'WHITE' ? 1 : 2;
    
    // Mapping piece type ke Solidity enum PieceType
    const pieceMap: Record<PieceType, number> = {
      PAWN: 1,
      KNIGHT: 2,
      BISHOP: 3,
      ROOK: 4,
      QUEEN: 5,
      KING: 6,
    };
    const pieceNum = pieceMap[piece];
    const priceEth = PIECE_PRICES[piece];

    // Konversi string gameId ke BigInt uint256 untuk contract call
    const cleanGameId = gameId.replace('game_', '');
    const gameIdUint = BigInt(cleanGameId);

    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PawnPoolABI,
      functionName: 'placeBet',
      args: [gameIdUint, BigInt(turnNumber), teamNum, pieceNum],
      value: parseEther(priceEth),
      chainId: CHAIN_ID,
    });
  };

  return {
    placeBet,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
