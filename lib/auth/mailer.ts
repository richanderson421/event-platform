export async function sendMagicLinkEmail(email: string, magicUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error('Missing RESEND_API_KEY or EMAIL_FROM');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your Event Platform magic login link',
      html: `<p>Click to sign in:</p><p><a href="${magicUrl}">${magicUrl}</a></p><p>Link expires in 15 minutes.</p>`
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${text}`);
  }
}
