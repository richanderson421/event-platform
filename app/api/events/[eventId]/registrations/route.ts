import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { playerId } = await req.json();
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const approvedCount = await prisma.registration.count({ where: { eventId: params.eventId, status: 'APPROVED' } });
  const overCap = event.playerCap != null && approvedCount >= event.playerCap;

  let status: 'PENDING' | 'APPROVED' | 'WAITLISTED' = 'PENDING';
  if (event.registrationMode === 'OPEN' && !overCap) status = 'APPROVED';
  if (overCap && event.waitlistEnabled) status = 'WAITLISTED';

  const reg = await prisma.registration.upsert({
    where: { eventId_playerId: { eventId: params.eventId, playerId } },
    update: { status },
    create: { eventId: params.eventId, playerId, status }
  });

  await prisma.auditLog.create({
    data: {
      action: 'EVENT_UPDATED',
      eventId: params.eventId,
      organizationId: event.organizationId,
      targetType: 'registration',
      targetId: reg.id,
      metadata: { status }
    }
  });

  return NextResponse.json({ ok: true, registration: reg });
}

export async function PATCH(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { registrationId, status, actorUserId } = await req.json();
  const reg = await prisma.registration.update({ where: { id: registrationId }, data: { status } });
  const event = await prisma.event.findUniqueOrThrow({ where: { id: params.eventId } });

  await prisma.auditLog.create({
    data: {
      action: status === 'APPROVED' ? 'ORG_JOIN_APPROVED' : 'ORG_JOIN_DENIED',
      actorUserId,
      eventId: params.eventId,
      organizationId: event.organizationId,
      targetType: 'registration',
      targetId: registrationId,
      metadata: { status }
    }
  });

  return NextResponse.json({ ok: true, registration: reg });
}
