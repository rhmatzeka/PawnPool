import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Do I drag pieces?',
    body: 'No. The board is live display. You vote for a piece type, then AI chooses the legal move.',
  },
  {
    title: 'What do I click first?',
    body: 'Start with the team selector. Choose WHITE or BLACK, then wait until it is your team turn.',
  },
  {
    title: 'Why can\'t I click a piece?',
    body: 'Either it is not your team turn, or that piece has no legal move in the current board position.',
  },
  {
    title: 'How does voting work?',
    body: 'Pick a legal piece card. The highest-backed legal piece controls the turn when the timer ends.',
  },
  {
    title: 'What does AI do?',
    body: 'AI only chooses from legal moves for the winning piece. chess.js validates the rules.',
  },
  {
    title: 'What is an agent?',
    body: 'An agent is an optional helper that recommends which piece to back. You can still play manually.',
  },
  {
    title: 'What is the timer?',
    body: 'The timer shows how long the current team has to vote. When it reaches 0, the AI resolves the move.',
  },
  {
    title: 'Is this real ETH?',
    body: 'MVP mode may use demo accounting unless on-chain mode is enabled. Mainnet automation is blocked for safety.',
  },
];

export default function HowToPlayPage() {
  return (
    <main className="min-h-screen bg-[#120d0a] px-4 py-10 text-[#f3dfbf] md:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b58863]">New Player Guide</p>
        <h1 className="mt-2 text-4xl font-black">How to Play</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f3dfbf]/65">
          Learn the arena loop before joining a live match: choose a team, back a legal piece, and let AI resolve the move.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {SECTIONS.map((section, index) => (
            <section key={section.title} className="rounded-2xl border border-[#b58863]/20 bg-[#211713] p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#b58863] font-black text-[#120d0a]">{index + 1}</span>
              <h2 className="mt-4 text-xl font-black">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#f3dfbf]/65">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/arena/live" className="rounded-xl bg-[#d6a15f] px-5 py-3 text-center font-black text-[#120d0a]">Enter Live Arena</Link>
          <Link href="/agents/create" className="rounded-xl border border-[#d6a15f]/40 px-5 py-3 text-center font-black text-[#f3dfbf]">Create Agent</Link>
          <Link href="/matches" className="rounded-xl border border-[#f3dfbf]/15 px-5 py-3 text-center font-black text-[#f3dfbf]/80">View Matches</Link>
        </div>

        <div className="mt-5 rounded-xl border border-[#b58863]/20 bg-[#211713] p-4 text-sm text-[#f3dfbf]/60">
          Want to see the tutorial again? Open the arena and click <span className="font-black text-[#d6a15f]">How to Play</span>.
        </div>
      </div>
    </main>
  );
}
