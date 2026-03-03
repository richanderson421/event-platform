import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { swissLikePairings } from '@/lib/pairing/strategy';
import { requireOrgEditor } from '@/lib/auth/guards';

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const { periodId } = await req.json();

    const event = await prisma.event.findUniqueOrThrow({ where: { id: params.eventId } });
    const actor = await requireOrgEditor(event.organizationId);

    const registrations = await prisma.registration.findMany({
      where: { eventId: params.eventId, status: 'APPROVED' }
    });

    const standings = registrations.map((r) => ({ playerId: r.playerId, points: 0, opponents: [] as string[] }));
    const pairings = swissLikePairings(standings);
    const defaultStatus = event.pairingsRequireApproval ? 'PENDING_APPROVAL' : 'ACTIVE';

    await prisma.$transaction([
      ...pairings.map((p, idx) =>
        prisma.pairing.create({
          data: {
            periodId,
            player1Id: p.player1Id,
            player2Id: p.player2Id,
            tableNumber: idx + 1,
            byeAssigned: p.bye,
            status: defaultStatus,
            match: {
              create: {
                eventId: params.eventId,
                periodId,
                player1Id: p.player1Id,
                player2Id: p.player2Id
              }
            }
          }
        })
      ),
      prisma.auditLog.create({
        data: {
          action: 'PAIRINGS_GENERATED',
          actorUserId: actor.id,
          eventId: params.eventId,
          organizationId: event.organizationId,
          targetType: 'event',
          targetId: params.eventId,
          metadata: { count: pairings.length }
        }
      })
    ]);

    return NextResponse.json({ ok: true, pairings: pairings.length });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
