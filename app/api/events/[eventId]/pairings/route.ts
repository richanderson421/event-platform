import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { swissLikePairings } from '@/lib/pairing/strategy';

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { periodId, actorUserId } = await req.json();

  const registrations = await prisma.registration.findMany({
    where: { eventId: params.eventId, status: 'APPROVED' }
  });

  const standings = registrations.map((r) => ({ playerId: r.playerId, points: 0, opponents: [] as string[] }));
  const pairings = swissLikePairings(standings);

  const event = await prisma.event.findUniqueOrThrow({ where: { id: params.eventId } });
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
        actorUserId,
        eventId: params.eventId,
        organizationId: event.organizationId,
        targetType: 'event',
        targetId: params.eventId,
        metadata: { count: pairings.length }
      }
    })
  ]);

  return NextResponse.json({ ok: true, pairings: pairings.length });
}
