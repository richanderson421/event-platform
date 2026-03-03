export default function SignInPage() {
  return (
    <main className="stack">
      <section className="card" style={{ maxWidth: 460 }}>
        <h2>Sign in</h2>
        <p className="muted">Enter your email and we’ll send a magic login link.</p>
        <form method="post" action="/api/auth/magic-link" className="stack">
          <input name="email" type="email" placeholder="you@example.com" required />
          <button className="primary" type="submit">Send magic link</button>
        </form>
      </section>
    </main>
  );
}
