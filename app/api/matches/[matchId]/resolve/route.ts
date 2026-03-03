import { MatchOutcome } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { organizerResolveMatch } from '@/lib/events/match-reporting';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { matchId: string } }) {
  const { actorUserId, outcome, note } = (await req.json()) as {
    actorUserId: string;
    outcome: MatchOutcome;
    note?: string;
  };

  await organizerResolveMatch(params.matchId, outcome, actorUserId);
  const match = await prisma.match.update({ where: { id: params.matchId }, data: { resolutionNote: note ?? null } });

  await prisma.auditLog.create({
    data: {
      action: 'MATCH_OVERRIDDEN',
      actorUserId,
      eventId: match.eventId,
      targetType: 'match',
      targetId: match.id,
      metadata: { outcome, note: note ?? null }
    }
  });

  return NextResponse.json({ ok: true });
}
