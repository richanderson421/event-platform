'use client';

import { useEffect, useState } from 'react';

type Membership = {
  id: string;
  role: 'ORG_ADMIN' | 'EDITOR' | 'VIEWER';
  organization: {
    id: string;
    name: string;
    events: {
      id: string;
      name: string;
      state: string;
      playerCap: number | null;
      registrations: { player: { displayName: string; email: string } }[];
    }[];
    joinRequests: { id: string; user: { email: string }; createdAt: string }[];
  };
};

type RosterDrawerState = {
  eventName: string;
  players: { displayName: string; email: string }[];
} | null;

export default function OrgDashboardClient() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [status, setStatus] = useState('');
  const [rosterDrawer, setRosterDrawer] = useState<RosterDrawerState>(null);

  async function load() {
    const res = await fetch('/api/me/orgs');
    if (res.ok) {
      const data = await res.json();
      setMemberships(data.memberships || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createOrg(formData: FormData) {
    setStatus('Creating org...');
    const name = String(formData.get('org_name') || '');
    const res = await fetch('/api/orgs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name })
    });
    setStatus(res.ok ? 'Org created' : 'Create org failed');
    await load();
  }

  async function createLeague(orgId: string, formData: FormData) {
    setStatus('Creating league...');
    const name = String(formData.get('league_name') || 'New League');
    const res = await fetch(`/api/orgs/${orgId}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, visibility: 'PUBLIC', registrationMode: 'APPROVAL_REQUIRED' })
    });
    setStatus(res.ok ? 'League created' : 'Create league failed');
    await load();
  }

  async function setState(eventId: string, nextState: string) {
    const res = await fetch(`/api/events/${eventId}/state`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nextState })
    });
    setStatus(res.ok ? `Moved to ${nextState}` : 'State change failed');
    await load();
  }

  async function approveJoin(orgId: string, requestId: string) {
    const res = await fetch(`/api/orgs/${orgId}/join-requests`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ requestId, status: 'APPROVED', role: 'EDITOR', userType: 'JUDGE' })
    });
    setStatus(res.ok ? 'Join approved' : 'Approve failed');
    await load();
  }

  return (
    <>
      <main className="stack">
        <section className="card">
          <h2>Org Dashboard</h2>
          <p className="muted">Create organizations and manage leagues from one place.</p>
          {status && <p>{status}</p>}
          <form action={createOrg} className="row">
            <input name="org_name" placeholder="New Organization name" required />
            <button className="primary" type="submit">Create Organization</button>
          </form>
        </section>

        {memberships.length === 0 && <section className="card"><p>No org memberships yet.</p></section>}

        {memberships.map((m) => (
          <section key={m.id} className="card stack">
            <div className="row">
              <h3>{m.organization.name}</h3>
              <span className="badge">{m.role}</span>
            </div>

            {(m.role === 'ORG_ADMIN' || m.role === 'EDITOR') && (
              <form action={(fd) => createLeague(m.organization.id, fd)} className="row">
                <input name="league_name" placeholder="League name" required />
                <button className="primary" type="submit">Create League</button>
              </form>
            )}

            <h4>Events</h4>
            <ul>
              {m.organization.events.map((e) => (
                <li key={e.id} className="stack" style={{ marginBottom: 10 }}>
                  <div>
                    <strong>{e.name}</strong> <span className="badge">{e.state}</span>{' '}
                    <span className="badge">
                      {e.registrations.length}/{e.playerCap ?? '∞'} signed up
                    </span>
                  </div>
                  {(m.role === 'ORG_ADMIN' || m.role === 'EDITOR') && (
                    <div className="row">
                      <button onClick={() => setState(e.id, 'PUBLISHED')}>Publish</button>
                      <button onClick={() => setState(e.id, 'REGISTRATION_OPEN')}>Open Reg</button>
                      <button onClick={() => setState(e.id, 'IN_PROGRESS')}>Start</button>
                      <button
                        onClick={() => setRosterDrawer({
                          eventName: e.name,
                          players: e.registrations.map((r) => r.player)
                        })}
                      >
                        View Roster
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {m.role === 'ORG_ADMIN' && (
              <>
                <h4>Pending join requests</h4>
                <ul>
                  {m.organization.joinRequests.map((jr) => (
                    <li key={jr.id}>
                      {jr.user.email}{' '}
                      <button onClick={() => approveJoin(m.organization.id, jr.id)}>Approve as Editor/Judge</button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ))}
      </main>

      {rosterDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => setRosterDrawer(null)} />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Event roster">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>{rosterDrawer.eventName} Roster</h3>
              <button onClick={() => setRosterDrawer(null)}>Close</button>
            </div>
            <p className="muted">{rosterDrawer.players.length} player(s)</p>
            <ul>
              {rosterDrawer.players.length === 0 && <li>No players registered yet.</li>}
              {rosterDrawer.players.map((player) => (
                <li key={player.email}>
                  <strong>{player.displayName}</strong> <span className="muted">({player.email})</span>
                </li>
              ))}
            </ul>
          </aside>
        </>
      )}
    </>
  );
}
