import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { randomToken, sha256 } from './tokens';

const COOKIE_NAME = 'lgs_session';

export async function createSession(userId: string) {
  const raw = randomToken(32);
  const sessionHash = sha256(raw);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.session.create({ data: { userId, sessionHash, expiresAt } });
  cookies().set(COOKIE_NAME, raw, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', expires: expiresAt });
}

export async function getCurrentUser() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const session = await prisma.session.findUnique({
    where: { sessionHash: sha256(raw) },
    include: { user: true }
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  return session.user;
}
