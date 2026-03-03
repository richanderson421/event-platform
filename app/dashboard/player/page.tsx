import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export default async function PlayerDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');

  const regs = await prisma.registration.findMany({
    where: { playerId: user.id },
    include: { event: true },
    orderBy: { createdAt: 'desc' }
  });

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ player1Id: user.id }, { player2Id: user.id }],
      status: { in: ['OPEN', 'NEEDS_RESOLUTION'] }
    },
    include: { event: true }
  });

  return (
    <main>
      <h2>Player Dashboard</h2>
      <p>Signed in as <strong>{user.displayName}</strong> ({user.email})</p>
      <p><Link href="/public">Browse events</Link></p>
      <h3>My Registrations</h3>
      <ul>{regs.map((r) => <li key={r.id}>{r.event.name} — {r.status}</li>)}</ul>
      <h3>Active Matches</h3>
      <ul>{matches.map((m) => <li key={m.id}>{m.event.name} — {m.status}</li>)}</ul>
    </main>
  );
}
