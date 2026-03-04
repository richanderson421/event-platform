import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import OrgDashboardClient from '@/components/OrgDashboardClient';

export default async function OrgDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in/org');

  const hasOrgAccess = user.globalRole === 'PLATFORM_ADMIN' || (
    await prisma.orgMembership.count({ where: { userId: user.id, status: 'ACTIVE' } })
  ) > 0;

  if (!hasOrgAccess) redirect('/auth/sign-in/org?error=org-access-required');

  return <OrgDashboardClient />;
}
