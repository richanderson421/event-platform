import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireUser } from '@/lib/auth/guards';
import { getAllowedModes, type AppMode } from '@/lib/auth/mode';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const mode = String(form.get('mode') || 'PLAYER') as AppMode;
    const allowed = await getAllowedModes(user);

    let safeMode: AppMode = 'PLAYER';
    if (allowed.includes(mode)) {
      safeMode = mode;
      cookies().set('lgs_mode', mode, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
    }

    const redirectTo =
      safeMode === 'ADMIN' ? '/dashboard/admin' : safeMode === 'ORG' ? '/dashboard/org' : '/dashboard/player';

    return NextResponse.redirect(new URL(redirectTo, process.env.APP_URL || 'http://localhost:3000'));
  } catch {
    return NextResponse.redirect(new URL('/auth/sign-in', process.env.APP_URL || 'http://localhost:3000'));
  }
}
