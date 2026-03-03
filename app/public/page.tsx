import { prisma } from '@/lib/db';

export default async function PublicEventsPage() {
  const events = await prisma.event.findMany({
    where: {
      visibility: 'PUBLIC',
      state: { in: ['PUBLISHED', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED'] }
    },
    include: { organization: true, registrations: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main>
      <h2>Public Leagues</h2>
      <ul>
        {events.map((e) => (
          <li key={e.id} style={{ marginBottom: 12 }}>
            <strong>{e.name}</strong> — {e.organization.name}<br />
            State: {e.state} · Players: {e.registrations.filter((r) => r.status === 'APPROVED').length}
          </li>
        ))}
      </ul>
    </main>
  );
}
