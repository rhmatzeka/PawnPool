import { NextResponse } from 'next/server';
import { z } from 'zod';
import { VercelGameService } from '../../../../../../server/game-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  address: z.string(),
  team: z.enum(['WHITE', 'BLACK']),
  piece: z.enum(['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING']),
  amountWei: z.string(),
});

export async function POST(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params;
    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ ok: false, data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
    }

    const bet = await VercelGameService.placeBetMock(gameId, parsed.data.address, parsed.data.team, parsed.data.piece, parsed.data.amountWei);
    return NextResponse.json({ ok: true, data: bet, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = ['GAME_NOT_ACTIVE', 'TURN_LOCKED', 'WRONG_TEAM_TURN', 'TEAM_ALREADY_LOCKED', 'ALREADY_BET_THIS_TURN', 'PIECE_HAS_NO_LEGAL_MOVE'].includes(message) ? 400 : 500;
    return NextResponse.json({ ok: false, data: null, error: { code: message, message } }, { status });
  }
}
