'use client';

import { FormEvent, useState } from 'react';

type SignInCardProps = {
  title: string;
  description: string;
  returnTo?: string;
};

export default function SignInCard({ title, description, returnTo }: SignInCardProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('Sending your secure sign-in link...');

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, returnTo })
      });

      if (!res.ok) {
        setMessage('Something went wrong. Please try again in a moment.');
        return;
      }

      setMessage(`If ${email} is registered, a sign-in link is on the way. Check your inbox (and spam folder).`);
    } catch {
      setMessage('We could not reach the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="stack">
      <section className="card" style={{ maxWidth: 460 }}>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
        <form onSubmit={onSubmit} className="stack">
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>
        {message && <p className="muted">{message}</p>}
      </section>
    </main>
  );
}
