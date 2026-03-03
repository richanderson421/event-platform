import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// Replace with provider adapter (Resend/Postmark/etc.)
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const token = nanoid(32);
  const magicUrl = `${process.env.APP_URL}/auth/callback?token=${token}`;

  return NextResponse.json({ ok: true, email, magicUrl });
}
