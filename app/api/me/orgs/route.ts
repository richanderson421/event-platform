import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await requireUser();
    const memberships = await prisma.orgMembership.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      include: {
        organization: {
          include: {
            events: {
              orderBy: { createdAt: 'desc' },
              include: {
                registrations: {
                  where: { status: 'APPROVED' },
                  include: { player: { select: { displayName: true, email: true } } }
                }
              }
            },
            joinRequests: { where: { status: 'PENDING' }, include: { user: true }, orderBy: { createdAt: 'desc' } }
          }
        }
      }
    });
    return NextResponse.json({ memberships });
  } catch (e: any) {
    const msg = e?.message || 'error';
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }
}
