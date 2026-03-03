import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { User } from '@prisma/client';

export type AppMode = 'PLAYER' | 'ORG' | 'ADMIN';
const COOKIE = 'lgs_mode';

export async function getAllowedModes(user: User): Promise<AppMode[]> {
  const modes: AppMode[] = ['PLAYER'];
  if (user.globalRole === 'PLATFORM_ADMIN') modes.push('ADMIN');
  const memberships = await prisma.orgMembership.count({ where: { userId: user.id, status: 'ACTIVE' } });
  if (memberships > 0) modes.push('ORG');
  return modes;
}

export async function getCurrentMode(user: User): Promise<AppMode> {
  const allowed = await getAllowedModes(user);
  const raw = (cookies().get(COOKIE)?.value || 'PLAYER') as AppMode;
  return allowed.includes(raw) ? raw : allowed[0];
}
