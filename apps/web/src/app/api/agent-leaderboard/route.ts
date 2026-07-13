import { NextResponse } from 'next/server';
import { VercelGameService } from '../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await VercelGameService.getAgentLeaderboard();
    return NextResponse.json({ ok: true, data, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
