"use client";

import { useEffect, useState } from 'react';

type AgentRank = {
  agentId: string;
  name: string;
  ownerAddress: string;
  recommendations: number;
  submitted: number;
  avgConfidence: number;
};

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function AgentLeaderboardPage() {
  const [agents, setAgents] = useState<AgentRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/agent-leaderboard', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json.ok) setAgents(json.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#120d0a] px-4 py-10 text-[#f3dfbf] md:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b58863]">Agent League</p>
        <h1 className="mt-2 text-4xl font-black">Agent Leaderboard</h1>
        <p className="mt-2 text-sm text-[#f3dfbf]/65">Rank agents by recommendations, submitted picks, and confidence.</p>

        <div className="mt-8 grid gap-3">
          {loading && <div className="rounded-xl border border-[#b58863]/20 bg-[#211713] p-5 text-[#f3dfbf]/60">Loading agents...</div>}
          {!loading && agents.map((agent, index) => (
            <div key={agent.agentId} className="grid gap-3 rounded-xl border border-[#b58863]/20 bg-[#211713] p-4 text-sm md:grid-cols-[auto_1fr_auto_auto_auto] md:items-center">
              <span className="font-black text-[#d6a15f]">#{index + 1}</span>
              <div>
                <div className="font-black">{agent.name}</div>
                <div className="font-mono text-xs text-[#f3dfbf]/45">{shortAddress(agent.ownerAddress)}</div>
              </div>
              <span>{agent.recommendations} recs</span>
              <span>{agent.submitted} submitted</span>
              <span>{agent.avgConfidence.toFixed(1)}% avg confidence</span>
            </div>
          ))}
          {!loading && agents.length === 0 && <div className="rounded-xl border border-[#b58863]/20 bg-[#211713] p-5 text-[#f3dfbf]/60">No agent decisions yet.</div>}
        </div>
      </div>
    </main>
  );
}
