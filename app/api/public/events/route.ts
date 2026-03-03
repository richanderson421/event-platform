import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const events = await prisma.event.findMany({
    where: {
      visibility: 'PUBLIC',
      state: { in: ['PUBLISHED', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED'] }
    },
    include: { organization: true, registrations: true },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(
    { events },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
