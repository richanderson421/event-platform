import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');
  if (user.globalRole !== 'PLATFORM_ADMIN') redirect('/dashboard/player');

  const [orgs, users, logs] = await Promise.all([
    prisma.organization.findMany({ include: { events: true } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 25 })
  ]);

  return (
    <main>
      <h2>Platform Admin Dashboard</h2>
      <p>Organizations: {orgs.length} · Users: {users.length}</p>
      <h3>Recent Audit Logs</h3>
      <ul>
        {logs.map((l) => <li key={l.id}>{l.action} · {l.targetType}:{l.targetId}</li>)}
      </ul>
    </main>
  );
}
