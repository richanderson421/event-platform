import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomToken, sha256 } from '@/lib/auth/tokens';
import { sendMagicLinkEmail } from '@/lib/auth/mailer';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let email = '';
    if (contentType.includes('application/json')) {
      ({ email } = await req.json());
    } else {
      const form = await req.formData();
      email = String(form.get('email') || '');
    }
    email = email.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
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

    const magicUrl = `${process.env.APP_URL}/auth/callback?token=${token}`;
    await sendMagicLinkEmail(email, magicUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('magic-link error', error);
    return NextResponse.json({ ok: true });
  }
}
