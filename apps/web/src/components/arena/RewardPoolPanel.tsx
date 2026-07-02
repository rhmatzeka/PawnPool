"use client";

import React from 'react';
import { useArenaStore } from '../../stores/arena-store';

export const RewardPoolPanel: React.FC = () => {
  const { whitePoolWei, blackPoolWei, rewardPoolWei } = useArenaStore();

  // Convert dummy/mock values
  const totalPool = parseFloat(whitePoolWei) + parseFloat(blackPoolWei);

  return (
    <div className="w-full bg-[#2d241e] p-5 rounded-xl border border-[#b58863]/30 shadow-md">
      <div className="text-center mb-4">
        <span className="text-[10px] text-[#eedcbf]/60 uppercase font-bold tracking-wider">
          Total Prize Pool
        </span>
        <h2 className="text-2xl font-extrabold font-mono text-[#eedcbf] mt-1">
          {totalPool.toFixed(4)} ETH
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-[#b58863]/10 pt-4">
        <div className="bg-[#1e1713] p-3 rounded-lg border border-white/5 text-center">
          <span className="text-[10px] text-white/50 uppercase font-bold">
            White Pool
          </span>
          <div className="font-mono text-sm font-bold text-white mt-1">
            {whitePoolWei} ETH
          </div>
        </div>

        <div className="bg-[#1e1713] p-3 rounded-lg border border-white/5 text-center">
          <span className="text-[10px] text-neutral-400/50 uppercase font-bold">
            Black Pool
          </span>
          <div className="font-mono text-sm font-bold text-neutral-400 mt-1">
            {blackPoolWei} ETH
          </div>
        </div>
      </div>
    </div>
  );
};
export default RewardPoolPanel;
