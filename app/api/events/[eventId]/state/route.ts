import { EventState } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assertTransition } from '@/lib/events/state-machine';

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { nextState, actorUserId } = (await req.json()) as { nextState: EventState; actorUserId: string };
  const event = await prisma.event.findUnique({ where: { id: params.eventId } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // NOTE: membership/role lookup omitted in sample; enforce ORG_ADMIN/EDITOR/PLATFORM_ADMIN here.
  assertTransition(event.state, nextState);

  await prisma.$transaction([
    prisma.event.update({ where: { id: event.id }, data: { state: nextState } }),
    prisma.auditLog.create({
      data: {
        action: 'EVENT_STATE_CHANGED',
        actorUserId,
        organizationId: event.organizationId,
        eventId: event.id,
        targetType: 'event',
        targetId: event.id,
        metadata: { from: event.state, to: nextState }
      }
    })
  ]);

  return NextResponse.json({ ok: true });
}
