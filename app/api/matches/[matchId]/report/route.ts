import { MatchOutcome } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { submitMatchReport } from '@/lib/events/match-reporting';

export async function POST(req: NextRequest, { params }: { params: { matchId: string } }) {
  const { reporterId, outcome } = (await req.json()) as { reporterId: string; outcome: MatchOutcome };
  await submitMatchReport(params.matchId, reporterId, outcome);
  return NextResponse.json({ ok: true });
}
