'use client';

import { useEffect, useState } from 'react';

type EventRow = { id: string; name: string; state: string; organization: { name: string }; registrations: { status: string }[] };

export default function PublicEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [status, setStatus] = useState('');

  async function load() {
    const res = await fetch('/api/public/events');
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events || []);
    }
  }

  useEffect(() => { load(); }, []);

  async function join(eventId: string) {
    const res = await fetch(`/api/events/${eventId}/registrations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) });
    setStatus(res.ok ? 'Registration submitted' : 'Join failed (sign in first)');
  }

  return (
    <main>
      <h2>Public Leagues</h2>
      <p>{status}</p>
      <ul>
        {events.map((e) => (
          <li key={e.id} style={{ marginBottom: 12 }}>
            <strong>{e.name}</strong> — {e.organization.name}<br />
            State: {e.state} · Players: {e.registrations.filter((r) => r.status === 'APPROVED').length}{' '}
            <button onClick={() => join(e.id)}>Join</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
