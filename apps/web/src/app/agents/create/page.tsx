"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

const TEMPLATES = [
  {
    name: 'Aggressive Attacker',
    riskLevel: 'AGGRESSIVE',
    personality: 'Prioritize active pieces, captures, queen pressure, and king-side attacks.',
  },
  {
    name: 'Defensive Wall',
    riskLevel: 'DEFENSIVE',
    personality: 'Prefer safe moves, king safety, solid pawn structure, and low-risk development.',
  },
  {
    name: 'Balanced Strategist',
    riskLevel: 'BALANCED',
    personality: 'Balance material, mobility, center control, and tactical opportunities.',
  },
  {
    name: 'Gambit Hunter',
    riskLevel: 'AGGRESSIVE',
    personality: 'Accept calculated risk for initiative, activity, and attacking chances.',
  },
];

export default function CreateAgentPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [name, setName] = useState('Aggressive Attacker');
  const [personality, setPersonality] = useState('Prioritize active pieces, captures, queen pressure, and king-side attacks.');
  const [riskLevel, setRiskLevel] = useState('AGGRESSIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!address) {
      setError('Connect a wallet before creating an agent.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: address, name, personality, riskLevel }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error?.message || 'Failed to create agent');
      router.push('/agents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#120d0a] px-4 py-10 text-[#f3dfbf] md:px-6">
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl rounded-2xl border border-[#b58863]/20 bg-[#211713] p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b58863]">Agent Builder</p>
        <h1 className="mt-2 text-4xl font-black">Create Agent</h1>
        <p className="mt-2 text-sm text-[#f3dfbf]/65">Build a recommendation-only AI strategy agent. You stay in control before submitting any vote.</p>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {TEMPLATES.map((template) => (
            <button
              key={template.name}
              type="button"
              onClick={() => {
                setName(template.name);
                setRiskLevel(template.riskLevel);
                setPersonality(template.personality);
              }}
              className="rounded-xl border border-[#b58863]/20 bg-[#120d0a] p-3 text-left transition hover:border-[#d6a15f]/60"
            >
              <div className="text-sm font-black text-[#f3dfbf]">{template.name}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#d6a15f]">{template.riskLevel}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-bold uppercase tracking-wider text-[#f3dfbf]/70">
            Agent Name
            <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-4 py-3 normal-case text-[#f3dfbf] outline-none focus:border-[#d6a15f]" />
          </label>

          <label className="grid gap-2 text-sm font-bold uppercase tracking-wider text-[#f3dfbf]/70">
            Personality
            <textarea value={personality} onChange={(event) => setPersonality(event.target.value)} rows={4} className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-4 py-3 normal-case text-[#f3dfbf] outline-none focus:border-[#d6a15f]" />
          </label>

          <label className="grid gap-2 text-sm font-bold uppercase tracking-wider text-[#f3dfbf]/70">
            Risk Level
            <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)} className="rounded-xl border border-[#b58863]/25 bg-[#120d0a] px-4 py-3 text-[#f3dfbf] outline-none focus:border-[#d6a15f]">
              <option value="BALANCED">Balanced</option>
              <option value="AGGRESSIVE">Aggressive</option>
              <option value="DEFENSIVE">Defensive</option>
            </select>
          </label>

          {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

          <button disabled={loading || !address} className="rounded-xl bg-[#d6a15f] px-5 py-3 font-black text-[#120d0a] disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'Creating Agent...' : address ? 'Create Agent' : 'Connect Wallet First'}
          </button>
          </div>

          <aside className="rounded-2xl border border-[#b58863]/20 bg-[#120d0a] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b58863]">Preview</p>
            <h2 className="mt-3 text-2xl font-black">{name || 'Unnamed Agent'}</h2>
            <span className="mt-3 inline-flex rounded-full bg-[#b58863]/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#d6a15f]">{riskLevel}</span>
            <p className="mt-4 text-sm leading-6 text-[#f3dfbf]/65">{personality}</p>
            <div className="mt-5 rounded-xl bg-[#211713] p-4 text-xs leading-5 text-[#f3dfbf]/55">
              This agent recommends pieces based on legal moves, local strategy scoring, and optional Grok/xAI reasoning when configured.
            </div>
          </aside>
        </div>
      </form>
    </main>
  );
}
