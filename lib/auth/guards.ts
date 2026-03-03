import { prisma } from '@/lib/db';
import { getCurrentUser } from './session';

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  if (user.bannedAt) throw new Error('BANNED');
  return user;
}

export async function requireOrgEditor(orgId: string) {
  const user = await requireUser();
  if (user.globalRole === 'PLATFORM_ADMIN') return user;
  const membership = await prisma.orgMembership.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: user.id } }
  });
  if (!membership || membership.status !== 'ACTIVE') throw new Error('FORBIDDEN');
  if (!(membership.role === 'ORG_ADMIN' || membership.role === 'EDITOR')) throw new Error('FORBIDDEN');
  return user;
}

export async function requireOrgAdmin(orgId: string) {
  const user = await requireUser();
  if (user.globalRole === 'PLATFORM_ADMIN') return user;
  const membership = await prisma.orgMembership.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: user.id } }
  });
  if (!membership || membership.status !== 'ACTIVE' || membership.role !== 'ORG_ADMIN') throw new Error('FORBIDDEN');
  return user;
}

export async function requireOrgCreator() {
  const user = await requireUser();
  if (user.globalRole === 'PLATFORM_ADMIN') return user;
  const toMembership = await prisma.orgMembership.findFirst({
    where: { userId: user.id, status: 'ACTIVE', userType: 'TO' }
  });
  if (!toMembership) throw new Error('FORBIDDEN');
  return user;
}
