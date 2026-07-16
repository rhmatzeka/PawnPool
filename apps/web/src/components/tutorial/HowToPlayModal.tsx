"use client";

import { useEffect, useState } from 'react';

const TUTORIAL_SEEN_KEY = 'chessstake_tutorial_seen';

type TutorialStep = {
  target: string;
  title: string;
  body: string;
  action: string;
};

const STEPS: TutorialStep[] = [
  {
    target: 'board',
    title: 'This is the live board',
    body: 'You do not drag pieces manually. The board updates after voting and AI resolution.',
    action: 'Watch this area to follow the match position.',
  },
  {
    target: 'team-selector',
    title: 'Start here: choose a team',
    body: 'Click WHITE or BLACK first. You can vote only when it is your team turn.',
    action: 'Choose one team before backing a piece.',
  },
  {
    target: 'turn-status',
    title: 'Check whose turn it is',
    body: 'If your team is not moving, your piece buttons stay locked. Wait for your team turn.',
    action: 'Use this status to know when you can vote.',
  },
  {
    target: 'piece-grid',
    title: 'Choose a piece to back',
    body: 'Pick the piece type your team should move. The highest-backed legal piece controls the turn.',
    action: 'Click one active piece card when your team is moving.',
  },
  {
    target: 'piece-grid',
    title: 'Dark cards mean unavailable',
    body: 'A dark card means it is not your turn, or that piece has no legal move right now.',
    action: 'Only active cards can be selected.',
  },
  {
    target: 'agent-panel',
    title: 'Optional: use your agent',
    body: 'Your AI agent can recommend which piece to back. You still confirm before submitting.',
    action: 'Create an agent later or play manually now.',
  },
  {
    target: 'timer',
    title: 'The timer closes voting',
    body: 'When this reaches 0, voting closes and AI resolves the winning piece.',
    action: 'Submit before the timer ends.',
  },
  {
    target: 'reward-pool',
    title: 'This is the reward pool',
    body: 'It shows how much support each team has. MVP mode may use demo accounting.',
    action: 'Use it to understand match momentum.',
  },
  {
    target: 'move-history',
    title: 'Moves appear here',
    body: 'After AI moves, the move history records what happened each turn.',
    action: 'Check this to follow the match.',
  },
];

type HowToPlayModalProps = {
  open: boolean;
  onClose: () => void;
};

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
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
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const updateTargetRect = () => {
    const target = document.querySelector(`[data-tutorial="${current.target}"]`);
    if (!target) {
      setTargetRect(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  };

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setIsMobile(window.innerWidth < 768);
    trackTutorial('guided_tutorial_opened');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = document.querySelector(`[data-tutorial="${current.target}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    const timer = window.setTimeout(updateTargetRect, 350);
    trackTutorial('guided_tutorial_step_viewed', { step: step + 1, target: current.target, title: current.title });
    return () => window.clearTimeout(timer);
  }, [open, step, current.target, current.title]);

  useEffect(() => {
    if (!open) return;
    const onUpdate = () => {
      setIsMobile(window.innerWidth < 768);
      updateTargetRect();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleSkip();
    };
    window.addEventListener('scroll', onUpdate, true);
    window.addEventListener('resize', onUpdate);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', onUpdate, true);
      window.removeEventListener('resize', onUpdate);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, current.target, step]);

  if (!open) return null;

  const finish = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    trackTutorial('guided_tutorial_completed');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    trackTutorial('guided_tutorial_skipped', { step: step + 1, target: current.target });
    onClose();
  };

  const highlightStyle = targetRect
    ? {
        top: Math.max(8, targetRect.top - 8),
        left: Math.max(8, targetRect.left - 8),
        width: targetRect.width + 16,
        height: targetRect.height + 16,
      }
    : undefined;

  const tooltipStyle = !isMobile && targetRect
    ? {
        top: Math.min(window.innerHeight - 260, Math.max(16, targetRect.top + targetRect.height / 2 - 120)),
        left: targetRect.left + targetRect.width / 2 < window.innerWidth / 2
          ? Math.min(window.innerWidth - 420, targetRect.left + targetRect.width + 24)
          : Math.max(16, targetRect.left - 420),
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Guided tutorial">
      <div className="absolute inset-0 bg-black/72" />

      {highlightStyle && (
        <div
          className="fixed z-[60] rounded-2xl ring-2 ring-[#d6a15f] shadow-[0_0_42px_rgba(214,161,95,0.55)] pointer-events-none"
          style={highlightStyle}
        />
      )}

      <div
        className={`fixed z-[70] rounded-2xl border border-[#b58863]/30 bg-[#211713] p-4 text-[#f3dfbf] shadow-2xl ${isMobile ? 'bottom-4 left-4 right-4' : 'w-[390px]'}`}
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#b58863]">Step {step + 1} of {STEPS.length}</p>
            <h2 className="mt-1 text-xl font-black">{current.title}</h2>
          </div>
          <button type="button" onClick={handleSkip} className="rounded-lg border border-[#b58863]/30 px-3 py-1.5 text-xs font-bold text-[#f3dfbf]/70 hover:text-[#f3dfbf]">
            Skip
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-[#f3dfbf]/70">{current.body}</p>
        <div className="mt-3 rounded-xl bg-[#120d0a] p-3 text-xs font-semibold text-[#d6a15f]">{current.action}</div>

        <div className="mt-4 flex gap-1.5">
          {STEPS.map((item, index) => (
            <div key={item.title} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-[#d6a15f]' : 'bg-[#120d0a]'}`} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-xl border border-[#d6a15f]/30 px-4 py-2 text-sm font-black text-[#f3dfbf] disabled:cursor-not-allowed disabled:opacity-30">
            Back
          </button>
          <div className="flex gap-2">
            <a href="/how-to-play" className="rounded-xl border border-[#d6a15f]/30 px-4 py-2 text-center text-sm font-black text-[#f3dfbf]">Guide</a>
            <button type="button" onClick={isLast ? finish : () => setStep(step + 1)} className="rounded-xl bg-[#d6a15f] px-4 py-2 text-sm font-black text-[#120d0a]">
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
