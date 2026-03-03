import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrgEditor } from '@/lib/auth/guards';

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const { periodId } = await req.json();
    const event = await prisma.event.findUniqueOrThrow({ where: { id: params.eventId } });
    const actor = await requireOrgEditor(event.organizationId);

    const res = await prisma.pairing.updateMany({
      where: { periodId, status: 'PENDING_APPROVAL' },
      data: { status: 'ACTIVE' }
    });

    await prisma.auditLog.create({
      data: {
        action: 'PAIRINGS_APPROVED',
        actorUserId: actor.id,
        eventId: params.eventId,
        organizationId: event.organizationId,
        targetType: 'period',
        targetId: periodId,
        metadata: { activated: res.count }
      }
    });

    return NextResponse.json({ ok: true, activated: res.count });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
