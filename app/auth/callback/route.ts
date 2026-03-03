import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sha256 } from '@/lib/auth/tokens';
import { createSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/auth/sign-in?error=missing-token', req.url));

  const record = await prisma.magicLinkToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record) return NextResponse.redirect(new URL('/auth/sign-in?error=invalid-token', req.url));
  if (record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=expired-token', req.url));
  }

  await prisma.magicLinkToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  await createSession(record.userId);

  return NextResponse.redirect(new URL('/dashboard/player', req.url));
}
