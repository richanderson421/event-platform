import { EventState } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assertTransition } from '@/lib/events/state-machine';
import { requireOrgEditor } from '@/lib/auth/guards';

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const { nextState } = (await req.json()) as { nextState: EventState };
    const event = await prisma.event.findUnique({ where: { id: params.eventId } });
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const actor = await requireOrgEditor(event.organizationId);

    assertTransition(event.state, nextState);

    await prisma.$transaction([
      prisma.event.update({ where: { id: event.id }, data: { state: nextState } }),
      prisma.auditLog.create({
        data: {
          action: 'EVENT_STATE_CHANGED',
          actorUserId: actor.id,
          organizationId: event.organizationId,
          eventId: event.id,
          targetType: 'event',
          targetId: event.id,
          metadata: { from: event.state, to: nextState }
        }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
