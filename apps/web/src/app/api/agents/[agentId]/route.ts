import { NextResponse } from 'next/server';
import { prisma } from '../../../../server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  try {
    const { agentId } = await params;
    const body = await request.json();
    const ownerAddress = String(body.ownerAddress || '').toLowerCase();
    const agent = await prisma.playerAgent.findUnique({ where: { id: agentId } });

    if (!agent) return NextResponse.json({ ok: false, data: null, error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found.' } }, { status: 404 });
    if (!ownerAddress || agent.ownerAddress !== ownerAddress) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'AGENT_OWNER_MISMATCH', message: 'Only the owner can update this agent.' } }, { status: 403 });
    }

    const updated = await prisma.playerAgent.update({
      where: { id: agentId },
      data: {
        autoVoteEnabled: typeof body.autoVoteEnabled === 'boolean' ? body.autoVoteEnabled : agent.autoVoteEnabled,
        maxVoteWei: body.maxVoteWei ? String(body.maxVoteWei) : agent.maxVoteWei,
        leagueEnabled: typeof body.leagueEnabled === 'boolean' ? body.leagueEnabled : agent.leagueEnabled,
        planTier: body.planTier ? String(body.planTier) : agent.planTier,
      },
    });

    return NextResponse.json({ ok: true, data: updated, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, data: null, error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
