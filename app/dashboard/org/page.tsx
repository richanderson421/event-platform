import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export default async function OrgDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  const memberships = await prisma.orgMembership.findMany({
    where: { userId: user.id, status: 'ACTIVE' },
    include: { organization: { include: { events: true } } }
  });

  return (
    <main>
      <h2>Org Dashboard</h2>
      {memberships.length === 0 && <p>You are not an org member.</p>}
      {memberships.map((m) => (
        <section key={m.id} style={{ marginBottom: 16 }}>
          <h3>{m.organization.name}</h3>
          <p>Role: {m.role} {m.userType ? `(${m.userType})` : ''}</p>
          <ul>
            {m.organization.events.map((e) => (
              <li key={e.id}>{e.name} — {e.state}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
