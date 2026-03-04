import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in/admin');
  if (user.globalRole !== 'PLATFORM_ADMIN') redirect('/dashboard/player');

  const [orgs, users, logs] = await Promise.all([
    prisma.organization.findMany({
      include: {
        events: {
          include: {
            registrations: {
              where: { status: 'APPROVED' },
              include: { player: { select: { displayName: true } } }
            }
          }
        }
      }
    }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 25 })
  ]);

  return (
    <main className="stack">
      <section className="card">
        <h2>Platform Admin Dashboard</h2>
        <div className="row">
          <span className="badge">Organizations: {orgs.length}</span>
          <span className="badge">Users: {users.length}</span>
        </div>
      </section>
      <section className="card">
        <h3>Event Rosters</h3>
        <ul>
          {orgs.flatMap((o) => o.events.map((e) => (
            <li key={e.id}>
              <strong>{o.name} / {e.name}</strong> — {e.registrations.length}/{e.playerCap ?? '∞'}
              {e.registrations.length > 0 ? ` · ${e.registrations.map((r) => r.player.displayName).join(', ')}` : ''}
            </li>
          )))}
        </ul>
      </section>
      <section className="card">
        <h3>Recent Audit Logs</h3>
        <ul>
          {logs.map((l) => <li key={l.id}>{l.action} · {l.targetType}:{l.targetId}</li>)}
        </ul>
      </section>
    </main>
  );
}
