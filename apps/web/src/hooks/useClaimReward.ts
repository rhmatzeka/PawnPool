"use client";

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PawnPoolABI, CHAIN_ID } from 'shared';

const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';

export function useClaimReward() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimReward = async (gameId: string) => {
    const cleanGameId = gameId.replace('game_', '');
    const gameIdUint = BigInt(cleanGameId);

    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: PawnPoolABI,
      functionName: 'claimReward',
      args: [gameIdUint],
      chainId: CHAIN_ID,
    });
  };

  return {
    claimReward,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
