"use client";

import { useState } from 'react';

type ShareArenaButtonProps = {
  gameId?: string | null;
  label?: string;
};

export default function ShareArenaButton({ gameId, label = 'Share Arena' }: ShareArenaButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const path = gameId ? `/arena/${gameId}` : '/arena/live';
    const url = `${window.location.origin}${path}`;
    const text = 'Join this ChessStake AI chess arena. Back a team, vote strategy, and help control the next move.';

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'share_arena_clicked', gameId, payload: { path } }),
    }).catch(() => undefined);

    if (navigator.share) {
      try {
        await navigator.share({ title: 'ChessStake Live Arena', text, url });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-xl border border-[#d6a15f]/40 px-3 py-2 text-xs font-black text-[#f3dfbf] transition hover:bg-[#d6a15f]/10 md:px-4 md:text-sm"
    >
      {copied ? 'Copied Link' : label}
    </button>
  );
}
