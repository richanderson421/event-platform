import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const events = await prisma.event.findMany({
    where: {
      visibility: 'PUBLIC',
      state: { in: ['PUBLISHED', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED'] }
    },
    include: { organization: true, registrations: true },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ events });
}
