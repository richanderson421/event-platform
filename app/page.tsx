import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>LGS League MVP</h1>
      <p>Mobile-first event platform for local game stores.</p>
      <ul>
        <li><Link href="/public">Browse events</Link></li>
        <li><Link href="/dashboard/player">Player dashboard</Link></li>
        <li><Link href="/dashboard/org">Organization dashboard</Link></li>
        <li><Link href="/dashboard/admin">Platform admin dashboard</Link></li>
      </ul>
    </main>
  );
}
