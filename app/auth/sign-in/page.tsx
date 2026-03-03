export default function SignInPage() {
  return (
    <main>
      <h2>Sign in</h2>
      <form method="post" action="/api/auth/magic-link" style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
        <input name="email" type="email" placeholder="you@example.com" required />
        <button type="submit">Send magic link</button>
      </form>
      <p>Use seeded users: admin@platform.test / to@store.test / player@store.test</p>
    </main>
  );
}
