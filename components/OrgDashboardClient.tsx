'use client';

import { useEffect, useState } from 'react';

type MatchOutcome = 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'TIE' | 'BYE';

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
      registrations: { id: string; playerId: string; status: string; player: { displayName: string; email: string } }[];
      matches: {
        id: string;
        status: string;
        outcome: MatchOutcome | null;
        player1Id: string;
        player2Id: string | null;
      }[];
    }[];
    joinRequests: { id: string; user: { email: string }; createdAt: string }[];
  };
};

type RosterDrawerState = {
  eventName: string;
  players: { displayName: string; email: string }[];
} | null;

function stateMeta(state: string) {
  switch (state) {
    case 'DRAFT':
      return { className: 'state-outline-blue', next: 'Recommended next: Publish' };
    case 'PUBLISHED':
      return { className: 'state-outline-amber', next: 'Recommended next: Open registration' };
    case 'REGISTRATION_OPEN':
      return { className: 'state-outline-green', next: 'Recommended next: Start league once players are approved' };
    case 'IN_PROGRESS':
      return { className: 'state-outline-purple', next: 'Recommended next: Report and resolve matches' };
    case 'COMPLETED':
      return { className: 'state-outline-slate', next: 'Recommended next: Archive when ready' };
    case 'CANCELLED':
      return { className: 'state-outline-red', next: 'Recommended next: Archive to finalize' };
    case 'ARCHIVED':
      return { className: 'state-outline-slate', next: 'Final state' };
    default:
      return { className: 'state-outline-slate', next: 'Review state progression' };
  }
}

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

    let message = '';
    try {
      const data = await res.json();
      if (res.ok) {
        message = `Moved from ${data.fromState ?? 'previous'} to ${data.toState ?? nextState}`;
      } else if (data.code === 'INVALID_TRANSITION' && Array.isArray(data.allowedNextStates)) {
        message = `${data.error}. Allowed next states: ${data.allowedNextStates.join(', ')}`;
      } else {
        message = data.error || 'State change failed';
      }
    } catch {
      message = res.ok ? `Moved to ${nextState}` : 'State change failed';
    }

    setStatus(message);
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

  async function updateRegistration(eventId: string, registrationId: string, nextStatus: 'APPROVED' | 'DENIED') {
    const res = await fetch(`/api/events/${eventId}/registrations`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ registrationId, status: nextStatus })
    });
    setStatus(res.ok ? `Registration ${nextStatus.toLowerCase()}` : 'Registration update failed');
    await load();
  }

  async function resolveMatch(matchId: string, outcome: MatchOutcome) {
    const res = await fetch(`/api/matches/${matchId}/resolve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ outcome })
    });

    let message = res.ok ? 'Match result saved' : 'Failed to save match result';
    try {
      const data = await res.json();
      if (!res.ok && data?.error) message = data.error;
    } catch {}

    setStatus(message);
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
              {m.organization.events.map((e) => {
                const approvedPlayers = e.registrations.filter((r) => r.status === 'APPROVED').map((r) => r.player);
                const pendingRegistrations = e.registrations.filter((r) => r.status === 'PENDING');
                const activeMatches = e.matches.filter((match) => match.status === 'OPEN' || match.status === 'NEEDS_RESOLUTION');
                const byUserId = new Map(
                  e.registrations.map((r) => [r.playerId, r.player.displayName])
                );
                const meta = stateMeta(e.state);

                const nameFor = (playerId: string | null) => {
                  if (!playerId) return 'BYE';
                  return byUserId.get(playerId) || `${playerId.slice(0, 8)}...`;
                };

                return (
                  <li key={e.id} className="stack" style={{ marginBottom: 10 }}>
                    <div className="event-header">
                      <div>
                        <strong>{e.name}</strong>
                      </div>
                      <div className="row">
                        <span className={`badge state-badge ${meta.className}`}>{e.state}</span>
                        <span className="badge">
                          {approvedPlayers.length}/{e.playerCap ?? '∞'} approved
                        </span>
                        {pendingRegistrations.length > 0 && (
                          <span className="badge">{pendingRegistrations.length} pending</span>
                        )}
                      </div>
                    </div>
                    <p className="muted" style={{ marginTop: -4 }}>{meta.next}</p>

                    {(m.role === 'ORG_ADMIN' || m.role === 'EDITOR') && (
                      <div className="row">
                        <button onClick={() => setState(e.id, 'PUBLISHED')}>Publish</button>
                        <button onClick={() => setState(e.id, 'REGISTRATION_OPEN')}>Open Reg</button>
                        <button onClick={() => setState(e.id, 'IN_PROGRESS')}>Start</button>
                        <button
                          onClick={() => setRosterDrawer({
                            eventName: e.name,
                            players: approvedPlayers
                          })}
                        >
                          View Roster
                        </button>
                      </div>
                    )}

                    {(m.role === 'ORG_ADMIN' || m.role === 'EDITOR') && pendingRegistrations.length > 0 && (
                      <div className="stack">
                        <h4 style={{ marginBottom: 0 }}>Pending registrations</h4>
                        <ul>
                          {pendingRegistrations.map((reg) => (
                            <li key={reg.id}>
                              <strong>{reg.player.displayName}</strong> <span className="muted">({reg.player.email})</span>{' '}
                              <button onClick={() => updateRegistration(e.id, reg.id, 'APPROVED')}>Approve</button>{' '}
                              <button onClick={() => updateRegistration(e.id, reg.id, 'DENIED')}>Deny</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(m.role === 'ORG_ADMIN' || m.role === 'EDITOR') && e.state === 'IN_PROGRESS' && (
                      <div className="stack">
                        <h4 style={{ marginBottom: 0 }}>Match Desk</h4>
                        {activeMatches.length === 0 ? (
                          <p className="muted">No pending matches right now.</p>
                        ) : (
                          <ul>
                            {activeMatches.map((match) => (
                              <li key={match.id} className="stack" style={{ marginBottom: 8 }}>
                                <div>
                                  <strong>{nameFor(match.player1Id)}</strong> vs <strong>{nameFor(match.player2Id)}</strong>{' '}
                                  <span className="badge">{match.status}</span>
                                </div>
                                <div className="row">
                                  <button onClick={() => resolveMatch(match.id, 'PLAYER1_WIN')}>P1 Win</button>
                                  <button onClick={() => resolveMatch(match.id, 'PLAYER2_WIN')}>P2 Win</button>
                                  <button onClick={() => resolveMatch(match.id, 'TIE')}>Tie</button>
                                  <button onClick={() => resolveMatch(match.id, 'BYE')}>Bye</button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
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
