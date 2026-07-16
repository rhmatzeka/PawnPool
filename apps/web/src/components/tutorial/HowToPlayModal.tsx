"use client";

import { useEffect, useState } from 'react';

const TUTORIAL_SEEN_KEY = 'chessstake_tutorial_seen';

const STEPS = [
  {
    title: '1. Look at the Board',
    body: 'The board shows the live chess position. You do not drag pieces manually. Your job is to choose which piece type your team should move.',
  },
  {
    title: '2. Choose Your Team',
    body: 'Start by clicking WHITE or BLACK in the action panel. You can only vote when the current turn matches your team.',
  },
  {
    title: '3. Check Whose Turn It Is',
    body: 'If you joined BLACK but the turn says WHITE, your piece buttons stay locked. Wait until BLACK turn comes back.',
  },
  {
    title: '4. Choose a Piece Card',
    body: 'Click a legal piece card like Pawn, Knight, Bishop, Rook, Queen, or King. The highest-backed legal piece wins this turn.',
  },
  {
    title: '5. Disabled Cards Are Normal',
    body: 'A dark or disabled card means either it is not your team\'s turn or that piece has no legal move right now.',
  },
  {
    title: '6. Optional: Use Your Agent',
    body: 'Your AI agent can recommend which piece to back. It does not vote unless you click confirm or enable demo auto-vote.',
  },
  {
    title: '7. Watch the Timer',
    body: 'When the timer reaches 0, voting closes. The piece with the most support is locked for AI resolution.',
  },
  {
    title: '8. AI Makes the Move',
    body: 'AI chooses the best legal move for the winning piece. Then the board updates and the next team gets a turn.',
  },
  {
    title: '9. Repeat Each Turn',
    body: 'Keep choosing pieces when it is your team\'s turn. The match continues until checkmate, draw, max turns, or cancellation.',
  },
];

type HowToPlayModalProps = {
  open: boolean;
  onClose: () => void;
};

function trackTutorial(name: string, payload?: unknown) {
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, payload }),
  }).catch(() => undefined);
}

export function shouldShowTutorial() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TUTORIAL_SEEN_KEY) !== 'true';
}

export default function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    trackTutorial('tutorial_opened');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    trackTutorial('tutorial_step_viewed', { step: step + 1, title: STEPS[step].title });
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    trackTutorial('tutorial_completed');
    onClose();
    window.setTimeout(() => {
      document.querySelector('[data-tutorial="team-selector"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    trackTutorial('tutorial_skipped', { step: step + 1 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-label="How to play ChessStake">
      <div className="w-full max-w-lg rounded-2xl border border-[#b58863]/30 bg-[#211713] p-5 text-[#f3dfbf] shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b58863]">How to Play</p>
            <h2 className="mt-2 text-2xl font-black">{current.title}</h2>
          </div>
          <button type="button" onClick={handleSkip} className="rounded-lg border border-[#b58863]/30 px-3 py-1.5 text-xs font-bold text-[#f3dfbf]/70 hover:text-[#f3dfbf]">
            Skip
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#f3dfbf]/70">{current.body}</p>

        <div className="mt-5 flex gap-2">
          {STEPS.map((item, index) => (
            <div key={item.title} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-[#d6a15f]' : 'bg-[#120d0a]'}`} />
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-[#120d0a] p-3 text-xs text-[#f3dfbf]/55">
          Tip: If you are unsure what to click first, choose a team, then choose one legal piece card when it is your turn.
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-xl border border-[#d6a15f]/30 px-4 py-2 text-sm font-black text-[#f3dfbf] disabled:cursor-not-allowed disabled:opacity-30">
            Back
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href="/how-to-play" className="rounded-xl border border-[#d6a15f]/30 px-4 py-2 text-center text-sm font-black text-[#f3dfbf]">Full Guide</a>
            <button type="button" onClick={isLast ? finish : () => setStep(step + 1)} className="rounded-xl bg-[#d6a15f] px-4 py-2 text-sm font-black text-[#120d0a]">
              {isLast ? 'Start Playing' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
