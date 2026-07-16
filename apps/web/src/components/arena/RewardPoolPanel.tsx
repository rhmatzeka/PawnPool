"use client";

import React from 'react';
import { useArenaStore } from '../../stores/arena-store';

export const RewardPoolPanel: React.FC = () => {
  const { whitePoolWei, blackPoolWei } = useArenaStore();

  const formatEth = (wei: string) => {
    const eth = Number(BigInt(wei)) / 1e18;
    return `${eth.toFixed(4)} ETH`;
  };

  const totalPoolWei = (BigInt(whitePoolWei) + BigInt(blackPoolWei)).toString();
  const totalPool = BigInt(totalPoolWei);
  const whitePool = BigInt(whitePoolWei);
  const blackPool = BigInt(blackPoolWei);
  const rewardAfterFeeWei = totalPool > BigInt(0) ? ((totalPool * BigInt(9500)) / BigInt(10000)).toString() : '0';
  const whitePercent = totalPool > BigInt(0) ? Number((whitePool * BigInt(10000)) / totalPool) / 100 : 50;
  const blackPercent = totalPool > BigInt(0) ? 100 - whitePercent : 50;
  const leader = whitePool === blackPool ? 'Even momentum' : whitePool > blackPool ? 'White leads' : 'Black leads';

  return (
    <div data-tutorial="reward-pool" className="w-full bg-[#2d241e] p-3 rounded-xl border border-[#b58863]/30 shadow-md">
      <div className="text-center mb-2">
        <span className="text-[10px] text-[#eedcbf]/60 uppercase font-bold tracking-wider">
          Total Prize Pool
        </span>
        <h2 className="text-lg font-extrabold font-mono text-[#eedcbf] mt-1 md:text-xl">
          {formatEth(totalPoolWei)}
        </h2>
        <p className="mt-1 text-xs font-semibold text-[#b58863]">
          Projected rewards after fee: {formatEth(rewardAfterFeeWei)}
        </p>
      </div>

      <div className="mb-2 rounded-lg border border-[#b58863]/15 bg-[#1e1713] p-2.5">
        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#eedcbf]/55">
          <span>{leader}</span>
          <span>{whitePercent.toFixed(1)}% / {blackPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#120d0a]">
          <div className="h-full bg-[#eedcbf]" style={{ width: `${whitePercent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[#b58863]/10 pt-2">
        <div className="bg-[#1e1713] p-2.5 rounded-lg border border-white/5 text-center">
          <span className="text-[10px] text-white/50 uppercase font-bold">
            White Pool
          </span>
          <div className="font-mono text-sm font-bold text-white mt-1">
            {formatEth(whitePoolWei)}
          </div>
        </div>

        <div className="bg-[#1e1713] p-2.5 rounded-lg border border-white/5 text-center">
          <span className="text-[10px] text-neutral-400/50 uppercase font-bold">
            Black Pool
          </span>
          <div className="font-mono text-sm font-bold text-neutral-400 mt-1">
            {formatEth(blackPoolWei)}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] text-[#eedcbf]/35">MVP mode may use demo accounting unless on-chain mode is enabled.</p>
    </div>
  );
};
export default RewardPoolPanel;
