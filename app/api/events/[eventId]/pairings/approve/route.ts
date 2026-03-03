import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { periodId, actorUserId } = await req.json();
  const event = await prisma.event.findUniqueOrThrow({ where: { id: params.eventId } });

  const res = await prisma.pairing.updateMany({
    where: { periodId, status: 'PENDING_APPROVAL' },
    data: { status: 'ACTIVE' }
  });

  await prisma.auditLog.create({
    data: {
      action: 'PAIRINGS_APPROVED',
      actorUserId,
      eventId: params.eventId,
      organizationId: event.organizationId,
      targetType: 'period',
      targetId: periodId,
      metadata: { activated: res.count }
    }
  });

  return NextResponse.json({ ok: true, activated: res.count });
}
