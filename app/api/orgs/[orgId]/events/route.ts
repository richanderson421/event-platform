import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireOrgEditor } from '@/lib/auth/guards';

export async function POST(req: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const user = await requireOrgEditor(params.orgId);
    const body = await req.json();

    const event = await prisma.event.create({
      data: {
        organizationId: params.orgId,
        createdById: user.id,
        type: 'LEAGUE',
        name: String(body.name || 'New League'),
        description: body.description || null,
        visibility: body.visibility || 'PUBLIC',
        registrationMode: body.registrationMode || 'APPROVAL_REQUIRED',
        playerCap: body.playerCap ? Number(body.playerCap) : null,
        waitlistEnabled: body.waitlistEnabled !== false,
        pairingsRequireApproval: body.pairingsRequireApproval !== false,
        leagueConfig: {
          create: {
            matchesPerPeriod: Number(body.matchesPerPeriod || 1),
            periodLengthDays: Number(body.periodLengthDays || 7),
            numberOfPeriods: body.numberOfPeriods ? Number(body.numberOfPeriods) : 8,
            scoringWin: Number(body.scoringWin || 3),
            scoringTie: Number(body.scoringTie || 1),
            scoringLoss: Number(body.scoringLoss || 0)
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'EVENT_CREATED',
        actorUserId: user.id,
        organizationId: params.orgId,
        eventId: event.id,
        targetType: 'event',
        targetId: event.id,
        metadata: { name: event.name }
      }
    });

    return NextResponse.json({ ok: true, event });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
