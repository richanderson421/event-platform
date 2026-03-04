type SignInCardProps = {
  title: string;
  description: string;
  returnTo?: string;
};

export default function SignInCard({ title, description, returnTo }: SignInCardProps) {
  return (
    <main className="stack">
      <section className="card" style={{ maxWidth: 460 }}>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
        <form method="post" action="/api/auth/magic-link" className="stack">
          <input name="email" type="email" placeholder="you@example.com" required />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <button className="primary" type="submit">Send magic link</button>
        </form>
      </section>
    </main>
  );
}
