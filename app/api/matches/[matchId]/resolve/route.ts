import { MatchOutcome } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { organizerResolveMatch } from '@/lib/events/match-reporting';
import { prisma } from '@/lib/db';
import { requireOrgEditor } from '@/lib/auth/guards';

export async function POST(req: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const { outcome, note } = (await req.json()) as { outcome: MatchOutcome; note?: string };
    const match = await prisma.match.findUniqueOrThrow({ where: { id: params.matchId } });
    const actor = await requireOrgEditor((await prisma.event.findUniqueOrThrow({ where: { id: match.eventId } })).organizationId);

    await organizerResolveMatch(params.matchId, outcome, actor.id);
    const updated = await prisma.match.update({ where: { id: params.matchId }, data: { resolutionNote: note ?? null } });

    await prisma.auditLog.create({
      data: {
        action: 'MATCH_OVERRIDDEN',
        actorUserId: actor.id,
        eventId: updated.eventId,
        targetType: 'match',
        targetId: updated.id,
        metadata: { outcome, note: note ?? null }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
