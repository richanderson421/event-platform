import Link from 'next/link';

export default function Home() {
  return (
    <main className="stack">
      <section className="card">
        <h1>Event Platform MVP</h1>
        <p className="muted">Clean, mobile-first tooling for local game store leagues.</p>
        <div className="row">
          <Link className="btn primary" href="/auth/sign-in">Sign in</Link>
          <Link className="btn" href="/public">Browse events</Link>
        </div>
      </section>
    </main>
  );
}
