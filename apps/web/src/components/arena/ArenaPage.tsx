"use client";

import React from 'react';
import LiveChessBoard from './LiveChessBoard';
import GameStatusPanel from './GameStatusPanel';
import RewardPoolPanel from './RewardPoolPanel';
import MoveHistoryPanel from './MoveHistoryPanel';
import AiThinkingPanel from './AiThinkingPanel';
import VotingTimer from '../voting/VotingTimer';
import VotingPanel from '../voting/VotingPanel';
import WalletConnectButton from '../layout/WalletConnectButton';
import { useArenaSocket } from '../../hooks/useArenaSocket';

export const ArenaPage: React.FC = () => {
  useArenaSocket();

  return (
    <div className="min-h-screen bg-[#1e1713] text-[#eedcbf] flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#110d0a] border-b border-[#b58863]/20 py-4 px-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <div className="bg-[#b58863] text-[#110d0a] font-extrabold px-3 py-1.5 rounded-lg text-lg uppercase tracking-wider font-mono">
            PawnPool
          </div>
          <span className="text-xs uppercase tracking-wider font-bold opacity-40 ml-2 hidden sm:inline">
            Web3 AI Chess Betting
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs bg-[#b58863]/10 border border-[#b58863]/30 px-3 py-1.5 rounded-lg font-bold text-[#b58863] hidden md:inline-block">
            Testnet Mode (Base Sepolia)
          </div>
          <WalletConnectButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Board + Status (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col items-center gap-4 w-full">
          <GameStatusPanel />

          <div className="relative w-full flex justify-center">
            <LiveChessBoard />
            <AiThinkingPanel />
          </div>

          <MoveHistoryPanel />
        </div>

        {/* Right Column: Betting + Timer (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4 w-full">
          <VotingTimer />
          
          <RewardPoolPanel />

          <VotingPanel />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full bg-[#110d0a] border-t border-[#b58863]/10 py-4 px-6 text-center text-xs text-[#eedcbf]/40">
        PawnPool &copy; {new Date().getFullYear()} - Play responsibly. Base Sepolia testnet only.
      </footer>
    </div>
  );
};
export default ArenaPage;
