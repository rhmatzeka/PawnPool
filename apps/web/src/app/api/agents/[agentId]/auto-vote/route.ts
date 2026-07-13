import { NextResponse } from 'next/server';
import { VercelGameService } from '../../../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const body = await request.json();
    const gameId = String(body.gameId || '').trim();
    const address = String(body.address || '').trim();

    if (!gameId || !address) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'INVALID_INPUT', message: 'Game ID and address are required.' } }, { status: 400 });
    }

    const result = await VercelGameService.autoVoteWithAgent(agentId, gameId, address);
    await VercelGameService.trackEvent({ name: 'agent_auto_vote_submitted', gameId, address, payload: { agentId } });
    return NextResponse.json({ ok: true, data: result, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: message, message } }, { status: 500 });
  }
}
