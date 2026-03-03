import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, requireOrgAdmin } from '@/lib/auth/guards';

export async function POST(req: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const user = await requireUser();
    const { message } = await req.json();
    const jr = await prisma.orgJoinRequest.create({
      data: { organizationId: params.orgId, userId: user.id, message: message || null }
    });
    await prisma.auditLog.create({ data: { action: 'ORG_JOIN_REQUESTED', actorUserId: user.id, organizationId: params.orgId, targetType: 'org_join_request', targetId: jr.id, metadata: {} } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { orgId: string } }) {
  try {
    const admin = await requireOrgAdmin(params.orgId);
    const { requestId, status, role = 'VIEWER', userType = null } = await req.json();
    const jr = await prisma.orgJoinRequest.update({ where: { id: requestId }, data: { status, reviewedAt: new Date() } });
    if (status === 'APPROVED') {
      await prisma.orgMembership.upsert({
        where: { organizationId_userId: { organizationId: params.orgId, userId: jr.userId } },
        update: { role, userType, status: 'ACTIVE' },
        create: { organizationId: params.orgId, userId: jr.userId, role, userType, status: 'ACTIVE' }
      });
    }
    await prisma.auditLog.create({ data: { action: status === 'APPROVED' ? 'ORG_JOIN_APPROVED' : 'ORG_JOIN_DENIED', actorUserId: admin.id, organizationId: params.orgId, targetType: 'org_join_request', targetId: requestId, metadata: { status, role, userType } } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
