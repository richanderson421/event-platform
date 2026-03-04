import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomToken, sha256 } from '@/lib/auth/tokens';
import { sendMagicLinkEmail } from '@/lib/auth/mailer';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let email = '';
    let returnTo = '';
    if (contentType.includes('application/json')) {
      ({ email, returnTo = '' } = await req.json());
    } else {
      const form = await req.formData();
      email = String(form.get('email') || '');
      returnTo = String(form.get('returnTo') || '');
    }
    email = email.trim().toLowerCase();
    returnTo = returnTo.trim();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (!user) return NextResponse.json({ ok: true });

    const token = randomToken(24);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await prisma.magicLinkToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt
      }
    });

    const callbackUrl = new URL('/auth/callback', process.env.APP_URL);
    callbackUrl.searchParams.set('token', token);
    if (returnTo.startsWith('/')) callbackUrl.searchParams.set('returnTo', returnTo);
    const magicUrl = callbackUrl.toString();
    await sendMagicLinkEmail(email, magicUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('magic-link error', error);
    return NextResponse.json({ ok: true });
  }
}
