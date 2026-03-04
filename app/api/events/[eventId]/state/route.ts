import { EventState } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assertTransition } from '@/lib/events/state-machine';
import { requireOrgEditor } from '@/lib/auth/guards';

const allowed: Record<EventState, EventState[]> = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['REGISTRATION_OPEN', 'DRAFT', 'CANCELLED'],
  REGISTRATION_OPEN: ['IN_PROGRESS', 'PUBLISHED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
  CANCELLED: ['ARCHIVED']
};

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const { nextState } = (await req.json()) as { nextState: EventState };
    const event = await prisma.event.findUnique({ where: { id: params.eventId } });
    if (!event) return NextResponse.json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' }, { status: 404 });
    const actor = await requireOrgEditor(event.organizationId);

    if (!nextState || !(nextState in allowed)) {
      return NextResponse.json({ error: 'Invalid next state', code: 'INVALID_NEXT_STATE' }, { status: 400 });
    }

    if (!allowed[event.state].includes(nextState)) {
      return NextResponse.json(
        {
          error: `Cannot move event from ${event.state} to ${nextState}`,
          code: 'INVALID_TRANSITION',
          currentState: event.state,
          nextState,
          allowedNextStates: allowed[event.state]
        },
        { status: 400 }
      );
    }

    if (nextState === 'IN_PROGRESS') {
      const approvedCount = await prisma.registration.count({ where: { eventId: event.id, status: 'APPROVED' } });
      if (approvedCount < 2) {
        return NextResponse.json(
          {
            error: `At least 2 approved players are required to start. Current approved players: ${approvedCount}`,
            code: 'INSUFFICIENT_APPROVED_PLAYERS',
            approvedCount
          },
          { status: 400 }
        );
      }
    }

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

    return NextResponse.json({ ok: true, fromState: event.state, toState: nextState });
  } catch (e: any) {
    const msg = e?.message || 'error';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'Sign in required', code: 'UNAUTHORIZED' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'You do not have permission to update this event', code: 'FORBIDDEN' }, { status: 403 });
    if (msg === 'BANNED') return NextResponse.json({ error: 'Your account is banned', code: 'BANNED' }, { status: 403 });
    return NextResponse.json({ error: msg, code: 'STATE_CHANGE_FAILED' }, { status: 500 });
  }
}
