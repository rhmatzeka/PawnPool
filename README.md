# ChessStake - Web3 AI Chess Betting Arena

ChessStake adalah arena permainan catur Web3 berbasis kecerdasan buatan (AI) di mana penonton dapat connect wallet, memilih tim White/Black, dan memasang taruhan/vote untuk menentukan jenis bidak yang akan digerakkan. Untuk demo Vercel-only, vote berjalan dalam mock mode dan AI resolve dilakukan lewat Next.js API routes.

---

## Konsep Inti

1. **AI-Driven Movement**: Menghilangkan faktor kecurangan/sabotase dari pemain manusia. AI selalu melangkah secara optimal untuk bidak yang memenangkan voting.
2. **Tiered Betting per Piece**: Setiap bidak memiliki harga vote yang berbeda:
   - Pawn: 0.0001 ETH
   - King: 0.0002 ETH
   - Knight: 0.0003 ETH
   - Bishop: 0.0003 ETH
   - Rook: 0.0005 ETH
   - Queen: 0.0010 ETH
3. **Turn Rules**:
   - Durasi voting per turn adalah 20 detik.
   - User hanya boleh memasang taruhan 1 kali per turn.
   - User tidak boleh pindah tim (White/Black) setelah first bet di game tersebut.
   - Jika satu turn tidak mendapat vote, timer dibuka ulang maksimal 3 kali sebelum game dibatalkan otomatis (auto-cancel).
4. **Pool & Settlement**:
   - Pemenang mendapatkan 90% dari total pool (White + Black pool combined) secara proporsional.
   - Platform/developer fee adalah 10%, ditarik otomatis ke treasury saat game resolve.
   - Draw refund mengembalikan 90% pool secara proporsional ke semua bettor.
   - Cancel game mengembalikan 100% pool (tanpa platform fee).
   - Late transaction (tx confirmed setelah turn lock) tidak dihitung sebagai vote dan dapat diklaim refund 100% tanpa fee.

---

## Tech Stack

- **Frontend + API Demo**: Next.js App Router (TypeScript, Tailwind CSS, Zustand, polling API routes)
- **Database**: Prisma ORM + PostgreSQL (Neon Free direkomendasikan untuk Vercel)
- **Backend Legacy**: Express.js + Socket.IO masih ada di `apps/api`, tetapi tidak wajib untuk Vercel-only demo
- **Smart Contract**: Solidity (Hardhat, OpenZeppelin v5, deployed on Ethereum Sepolia)
- **AI Logic**: chess.js + Stockfish heuristik resolver

---

## Struktur Folder Project

```text
chessstake/
├── apps/
│   ├── web/                          # Next.js Frontend + API routes untuk Vercel-only demo
│   └── api/                          # Legacy Express REST API & Socket.IO Server
├── packages/
│   ├── contracts/                    # Hardhat Smart Contracts (Solidity)
│   └── shared/                       # Global Constants & Type-safe ABI exports
├── infra/                            # Docker compose & configuration
├── package.json                      # Workspace configuration
└── pnpm-workspace.yaml
```

---

## Persiapan & Instalasi

### 1. Prasyarat System
- Node.js >= 20
- pnpm >= 9
- PostgreSQL (Neon Free direkomendasikan)

### 2. Setup Project Dependencies
Jalankan di root folder:
```bash
pnpm install --no-frozen-lockfile --ignore-scripts
```

### 3. Setup Environment Variables
Salin `.env.example` ke `.env` di root project dan sesuaikan nilainya:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/chessstake
RPC_ETHEREUM_SEPOLIA=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_MOCK_CHAIN=true
PRIVATE_KEY=your_private_key
```

### 4. Setup Database & Prisma
Untuk Vercel-only demo, generate Prisma client di `apps/web`:
```bash
pnpm --filter web prisma:generate
```

---

## Menjalankan Project (Local Development)

### 1. Compile Smart Contracts
Jalankan kompilasi Solidity di packages/contracts:
```bash
npx hardhat compile
```
Untuk menjalankan unit tests:
```bash
npx hardhat test
```

### 2. Build Shared Package
Build constants & ABI compiler:
```bash
pnpm --filter shared build
```

### 3. Run Dev Server Vercel-Only
Jalankan Next.js web app. API game tersedia di route `/api` pada server yang sama:
```bash
pnpm --filter web dev
```
- Frontend berjalan di: http://localhost:3000
- API route berjalan di: http://localhost:3000/api

---

## Deploy Vercel-Only

Mode ini tidak membutuhkan Railway/Render/Koyeb. Next.js API routes menggantikan backend Express untuk demo.

1. Buat database PostgreSQL gratis di Neon.
2. Set Vercel environment variables:
```text
DATABASE_URL=postgresql://...
NEXT_PUBLIC_MOCK_CHAIN=true
NEXT_PUBLIC_ENABLE_ONCHAIN_BETS=false
```
3. Install command:
```bash
pnpm install --no-frozen-lockfile --ignore-scripts
```
4. Build command:
```bash
pnpm --filter web build
```
5. Redeploy dari branch `main`.

Catatan: mode Vercel-only memakai polling setiap 2 detik, bukan Socket.IO. Timer 0 memanggil `/api/games/:gameId/resolve-expired-turn` pada domain Vercel yang sama. Build web menjalankan `prisma db push` untuk membuat tabel demo di database yang ditunjuk `DATABASE_URL`.

Demo reward/refund tersedia di halaman `/claim` dan endpoint `/api/games/:gameId/settlement?address=0x...`. Mode ini hanya menandai settlement di database demo, bukan transfer ETH on-chain.

---

## Security & Invariants

- **ReentrancyGuard**: Dipakai pada penarikan rewards & refunds.
- **AccessControl**: Membagi otorisasi admin (`DEFAULT_ADMIN_ROLE`) dan backend operator (`OPERATOR_ROLE`).
- **Late Refund Safe accounting**: late bet dikeluarkan dari game.totalPool dan dipisahkan ke pool refundable user.
- **Idempotent Indexing**: Log events di-track menggunakan log index dan transaction hash agar aman dari reorg & replay.
