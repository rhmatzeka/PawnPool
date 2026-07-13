"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

type Agent = {
  id: string;
  name: string;
  personality: string;
  riskLevel: string;
  autoVoteEnabled: boolean;
  leagueEnabled: boolean;
  planTier: string;
  createdAt: string;
};

export default function AgentsPage() {
  const { address } = useAccount();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const loadAgents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/agents?ownerAddress=${encodeURIComponent(address)}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error?.message || 'Failed to load agents');
        setAgents(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [address]);

  const updateAgent = async (agentId: string, patch: Partial<Agent>) => {
    if (!address) return;
    const res = await fetch(`/api/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerAddress: address, ...patch }),
    });
    const json = await res.json();
    if (res.ok && json.ok) {
      setAgents((current) => current.map((agent) => agent.id === agentId ? { ...agent, ...json.data } : agent));
    }
  };

  return (
    <main className="min-h-screen bg-[#120d0a] px-4 py-10 text-[#f3dfbf] md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b58863]">Player-Owned AI</p>
            <h1 className="mt-2 text-4xl font-black">My Agents</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#f3dfbf]/65">Create strategy agents that recommend what piece to back during live arenas.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/agents/leaderboard" className="rounded-xl border border-[#d6a15f]/40 px-4 py-2.5 text-center text-sm font-black text-[#f3dfbf]">Agent League</Link>
            <Link href="/agents/create" className="rounded-xl bg-[#d6a15f] px-4 py-2.5 text-center text-sm font-black text-[#120d0a]">Create Agent</Link>
          </div>
        </div>

        {!address && <div className="mt-8 rounded-xl border border-[#b58863]/20 bg-[#211713] p-5 text-[#f3dfbf]/65">Connect a wallet to load your agents.</div>}
        {loading && <div className="mt-8 rounded-xl border border-[#b58863]/20 bg-[#211713] p-5 text-[#f3dfbf]/65">Loading agents...</div>}
        {error && <div className="mt-8 rounded-xl border border-red-400/30 bg-red-500/10 p-5 text-red-100">{error}</div>}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent) => (
            <article key={agent.id} className="rounded-xl border border-[#b58863]/20 bg-[#211713] p-4">
              <span className="rounded-full bg-[#b58863]/15 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#d6a15f]">{agent.riskLevel}</span>
              <h2 className="mt-3 truncate text-lg font-black">{agent.name}</h2>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#f3dfbf]/60">{agent.personality}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="rounded bg-[#120d0a] px-2 py-1 text-[#d6a15f]">{agent.planTier}</span>
                {agent.autoVoteEnabled && <span className="rounded bg-[#120d0a] px-2 py-1 text-green-300">Auto Demo</span>}
                {agent.leagueEnabled && <span className="rounded bg-[#120d0a] px-2 py-1 text-blue-300">League</span>}
              </div>
              <div className="mt-3 grid gap-2">
                <button type="button" onClick={() => updateAgent(agent.id, { autoVoteEnabled: !agent.autoVoteEnabled })} className="rounded-lg border border-[#d6a15f]/30 px-3 py-2 text-xs font-black text-[#f3dfbf]">
                  {agent.autoVoteEnabled ? 'Disable Demo Auto-Vote' : 'Enable Demo Auto-Vote'}
                </button>
                <button type="button" onClick={() => updateAgent(agent.id, { leagueEnabled: !agent.leagueEnabled })} className="rounded-lg border border-[#d6a15f]/30 px-3 py-2 text-xs font-black text-[#f3dfbf]">
                  {agent.leagueEnabled ? 'Leave Agent League' : 'Join Agent League'}
                </button>
              </div>
              <p className="mt-4 font-mono text-[10px] text-[#f3dfbf]/35">{agent.id}</p>
            </article>
          ))}
          {address && !loading && agents.length === 0 && <div className="rounded-xl border border-[#b58863]/20 bg-[#211713] p-5 text-sm text-[#f3dfbf]/60">No agents yet. Create your first strategy agent.</div>}
        </div>
      </div>
    </main>
  );
}
