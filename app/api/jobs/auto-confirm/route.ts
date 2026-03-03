import { NextResponse } from 'next/server';
import { autocConfirmExpiredReports } from '@/lib/events/match-reporting';

export async function POST() {
  await autocConfirmExpiredReports();
  return NextResponse.json({ ok: true });
}
