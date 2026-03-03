import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sha256 } from '@/lib/auth/tokens';

export async function POST() {
  const raw = cookies().get('lgs_session')?.value;
  if (raw) {
    await prisma.session.deleteMany({ where: { sessionHash: sha256(raw) } });
  }
  cookies().delete('lgs_session');
  return NextResponse.redirect(new URL('/auth/sign-in', process.env.APP_URL || 'http://localhost:3000'));
}
