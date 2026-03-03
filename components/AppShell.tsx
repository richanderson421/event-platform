import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getAllowedModes, getCurrentMode } from '@/lib/auth/mode';

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const allowedModes = user ? await getAllowedModes(user) : [];
  const mode = user ? await getCurrentMode(user) : 'PLAYER';

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <div className="row">
            <strong>Event Platform</strong>
            {user ? <span className="badge">{user.email}</span> : <span className="badge">Signed out</span>}
            {user && <span className="badge">Mode: {mode}</span>}
          </div>
          <div className="nav-links">
            <Link className="btn" href="/public">Browse</Link>
            <Link className="btn" href="/dashboard/player">Player</Link>
            <Link className="btn" href="/dashboard/org">Org</Link>
            <Link className="btn" href="/dashboard/admin">Admin</Link>
            {user && (
              <form className="row" action="/api/auth/mode" method="post">
                <input type="hidden" name="redirectTo" value="/" />
                <select name="mode" defaultValue={mode} style={{ width: 130 }}>
                  {allowedModes.includes('PLAYER') && <option value="PLAYER">Player</option>}
                  {allowedModes.includes('ORG') && <option value="ORG">TO/Org</option>}
                  {allowedModes.includes('ADMIN') && <option value="ADMIN">Platform Admin</option>}
                </select>
                <button className="btn" type="submit">Switch</button>
              </form>
            )}
            {!user ? (
              <Link className="btn primary" href="/auth/sign-in">Sign in</Link>
            ) : (
              <form action="/api/auth/logout" method="post">
                <button className="btn" type="submit">Logout</button>
              </form>
            )}
          </div>
        </div>
      </header>
      <div className="container">{children}</div>
    </>
  );
}
