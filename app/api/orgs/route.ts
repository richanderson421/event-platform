import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim() || null;
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const org = await prisma.organization.create({
      data: {
        name,
        description,
        createdById: user.id,
        memberships: {
          create: { userId: user.id, role: 'ORG_ADMIN', userType: 'TO', status: 'ACTIVE' }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ORG_CREATED',
        actorUserId: user.id,
        organizationId: org.id,
        targetType: 'organization',
        targetId: org.id,
        metadata: { name: org.name }
      }
    });

    return NextResponse.json({ ok: true, org });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
