# ChessStake Web

Next.js app untuk ChessStake. Mode deployment utama sekarang adalah **Vercel-only demo**: frontend, API game, AI move resolver, dan Prisma client berjalan di project Vercel yang sama.

## Local Development

```bash
pnpm install --no-frozen-lockfile --ignore-scripts
pnpm --filter web prisma:generate
pnpm --filter web dev
```

App berjalan di `http://localhost:3000`.

## Environment Variables

Minimal untuk Vercel-only demo:

```text
DATABASE_URL=postgresql://...
NEXT_PUBLIC_MOCK_CHAIN=true
NEXT_PUBLIC_ENABLE_ONCHAIN_BETS=false
```

Gunakan Neon Free untuk PostgreSQL jika tidak punya database sendiri.

## Vercel Deploy

Set Root Directory ke `apps/web` atau biarkan Vercel mendeteksi workspace `web`.

Build command:

```bash
pnpm --filter web build
```

Install command:

```bash
pnpm install --no-frozen-lockfile --ignore-scripts
```

API route tersedia di domain Vercel yang sama:

```text
/api/games/active
/api/games/:gameId/state
/api/games/:gameId/votes/mock-bet
/api/games/:gameId/resolve-expired-turn
```

Karena mode ini memakai polling, `NEXT_PUBLIC_API_URL` dan `NEXT_PUBLIC_SOCKET_URL` tidak diperlukan untuk demo Vercel-only. Build menjalankan `prisma db push` untuk membuat tabel demo otomatis di database `DATABASE_URL`.
