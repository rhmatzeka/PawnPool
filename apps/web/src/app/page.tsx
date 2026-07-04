import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#120d0a] text-[#f3dfbf]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-[#b58863]">
            Base Sepolia Testnet Arena
          </p>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Vote the piece. AI makes the move.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#f3dfbf]/70">
            PawnPool is a live Web3 chess arena where spectators back White or Black, vote for the piece type with testnet ETH, and watch an AI resolve the best legal move in realtime.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/arena/live" className="rounded-xl bg-[#d6a15f] px-6 py-3 text-center font-black text-[#120d0a] transition hover:bg-[#f0c178]">
              Enter Live Arena
            </Link>
            <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer" className="rounded-xl border border-[#d6a15f]/40 px-6 py-3 text-center font-bold text-[#f3dfbf] transition hover:bg-[#d6a15f]/10">
              View Base Sepolia
            </a>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[['1', 'Active arena'], ['20s', 'Voting window'], ['10%', 'Platform fee on settlement']].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-5">
              <div className="text-3xl font-black text-[#d6a15f]">{value}</div>
              <div className="mt-1 text-sm uppercase tracking-widest text-[#f3dfbf]/50">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {['Connect an EVM wallet on Base Sepolia.', 'Choose a team, then vote for a piece type.', 'AI picks the best legal move and broadcasts it live.'].map((step, index) => (
            <div key={step} className="rounded-2xl bg-[#1a120f] p-5 text-[#f3dfbf]/70">
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#b58863] font-black text-[#120d0a]">{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-3xl text-sm text-[#f3dfbf]/45">
          Testnet MVP only. Do not use real funds or mainnet betting before legal review.
        </p>
      </section>
    </main>
  );
}
