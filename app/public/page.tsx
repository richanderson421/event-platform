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
    <main className="stack">
      <section className="card">
        <h2>Public Leagues</h2>
        <p className="muted">Discover active leagues and register quickly.</p>
        {status && <p>{status}</p>}
      </section>
      <section className="stack">
        {events.map((e) => (
          <article key={e.id} className="card">
            <h3>{e.name}</h3>
            <p className="muted">{e.organization.name}</p>
            <div className="row">
              <span className="badge">{e.state}</span>
              <span className="badge">Players {e.registrations.filter((r) => r.status === 'APPROVED').length}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <button className="primary" onClick={() => join(e.id)}>Join League</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
