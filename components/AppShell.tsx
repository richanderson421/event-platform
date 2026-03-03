import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <div className="row">
            <strong>Event Platform</strong>
            {user ? <span className="badge">{user.email}</span> : <span className="badge">Signed out</span>}
          </div>
          <div className="nav-links">
            <Link className="btn" href="/public">Browse</Link>
            <Link className="btn" href="/dashboard/player">Player</Link>
            <Link className="btn" href="/dashboard/org">Org</Link>
            <Link className="btn" href="/dashboard/admin">Admin</Link>
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
