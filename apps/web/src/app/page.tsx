"use client";

import dynamic from 'next/dynamic';

const ArenaPage = dynamic(() => import('../components/arena/ArenaPage'), {
  ssr: false,
});

export default function Home() {
  return <ArenaPage />;
}
