import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrgEditor, requireUser } from '@/lib/auth/guards';

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const playerId = body.playerId || user.id;

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
        actorUserId: user.id,
        eventId: params.eventId,
        organizationId: event.organizationId,
        targetType: 'registration',
        targetId: reg.id,
        metadata: { status }
      }
    });

    return NextResponse.json({ ok: true, registration: reg });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const event = await prisma.event.findUniqueOrThrow({ where: { id: params.eventId } });
    const actor = await requireOrgEditor(event.organizationId);
    const { registrationId, status } = await req.json();
    const reg = await prisma.registration.update({ where: { id: registrationId }, data: { status } });

    await prisma.auditLog.create({
      data: {
        action: 'EVENT_UPDATED',
        actorUserId: actor.id,
        eventId: params.eventId,
        organizationId: event.organizationId,
        targetType: 'registration',
        targetId: registrationId,
        metadata: { status }
      }
    });

    return NextResponse.json({ ok: true, registration: reg });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
