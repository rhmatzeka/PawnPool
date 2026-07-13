import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#120d0a] text-[#f3dfbf]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-[#b58863]">
            Interactive AI Chess Arena
          </p>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Twitch Plays Chess with real stakes.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#f3dfbf]/70">
            ChessStake lets creators host live AI chess arenas where fans back a team, vote strategy, and share the upside from every match.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/arena/live" className="rounded-xl bg-[#d6a15f] px-6 py-3 text-center font-black text-[#120d0a] transition hover:bg-[#f0c178]">
              Enter Live Arena
            </Link>
            <Link href="/host" className="rounded-xl border border-[#d6a15f]/40 px-6 py-3 text-center font-bold text-[#f3dfbf] transition hover:bg-[#d6a15f]/10">
              Host a Match
            </Link>
            <Link href="/agents/create" className="rounded-xl border border-[#d6a15f]/40 px-6 py-3 text-center font-bold text-[#f3dfbf] transition hover:bg-[#d6a15f]/10">
              Create Your Agent
            </Link>
            <Link href="/matches" className="rounded-xl border border-[#f3dfbf]/15 px-6 py-3 text-center font-bold text-[#f3dfbf]/80 transition hover:bg-[#f3dfbf]/5">
              Browse Matches
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[["Creators", "Host community arenas"], ["20s", "Fast voting windows"], ["Rewards", "Shared match upside"]].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-5">
              <div className="text-3xl font-black text-[#d6a15f]">{value}</div>
              <div className="mt-1 text-sm uppercase tracking-widest text-[#f3dfbf]/50">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {["Join a creator-hosted chess arena.", "Back White or Black, then vote the strategy.", "AI resolves the best legal move and the crowd follows the match live."].map((step, index) => (
            <div key={step} className="rounded-2xl bg-[#1a120f] p-5 text-[#f3dfbf]/70">
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#b58863] font-black text-[#120d0a]">{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-6">
            <h2 className="text-xl font-black">Built for creators</h2>
            <p className="mt-3 text-sm leading-6 text-[#f3dfbf]/65">
              Turn passive viewers into a live strategy team. Host recurring arenas, share one link, and build community rituals around AI chess battles.
            </p>
          </div>
          <div className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-6">
            <h2 className="text-xl font-black">Designed for communities</h2>
            <p className="mt-3 text-sm leading-6 text-[#f3dfbf]/65">
              Schedule creator battles, community-vs-community matches, and sponsored prize pool events with transparent move history and reward accounting.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-[#b58863]/20 bg-[#211713] p-6">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#b58863]">Player-Owned AI</p>
              <h2 className="mt-2 text-2xl font-black">Build Your Chess Agent</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f3dfbf]/65">
                Create a personal AI strategy agent that recommends what piece to back during live chess arenas. Start with aggressive, balanced, or defensive playstyles.
              </p>
            </div>
            <Link href="/agents/create" className="rounded-xl bg-[#d6a15f] px-5 py-3 text-center font-black text-[#120d0a]">
              Create Agent
            </Link>
          </div>
        </div>

        <p className="mt-8 max-w-3xl text-sm text-[#f3dfbf]/45">
          Current public build is an MVP environment. Real-money mainnet reward pools require legal review before launch.
        </p>
      </section>
    </main>
  );
}
