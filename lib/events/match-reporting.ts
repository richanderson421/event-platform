import { MatchOutcome, MatchStatus, ResultSource } from '@prisma/client';
import { prisma } from '../db';

const AUTO_CONFIRM_MS = 5 * 60 * 1000;

export async function submitMatchReport(matchId: string, reporterId: string, outcome: MatchOutcome) {
  await prisma.matchReport.upsert({
    where: { matchId_reporterId: { matchId, reporterId } },
    update: { reportedOutcome: outcome },
    create: { matchId, reporterId, reportedOutcome: outcome }
  });

  const reports = await prisma.matchReport.findMany({ where: { matchId } });
  if (reports.length >= 2) {
    const [a, b] = reports;
    if (a.reportedOutcome === b.reportedOutcome) {
      await confirmMatch(matchId, a.reportedOutcome, ResultSource.AUTO_CONFIRMED);
    } else {
      await prisma.match.update({ where: { id: matchId }, data: { status: MatchStatus.NEEDS_RESOLUTION } });
    }
  }
}

export async function autocConfirmExpiredReports(now = new Date()) {
  const openMatches = await prisma.match.findMany({
    where: { status: MatchStatus.OPEN },
    include: { reports: true }
  });

  for (const match of openMatches) {
    if (match.reports.length !== 1) continue;
    const age = now.getTime() - match.reports[0].createdAt.getTime();
    if (age >= AUTO_CONFIRM_MS) {
      await confirmMatch(match.id, match.reports[0].reportedOutcome, ResultSource.AUTO_CONFIRMED);
    }
  }
}

export async function organizerResolveMatch(matchId: string, outcome: MatchOutcome, setByUserId: string) {
  await confirmMatch(matchId, outcome, ResultSource.ORGANIZER_OVERRIDE, setByUserId);
}

async function confirmMatch(matchId: string, outcome: MatchOutcome, source: ResultSource, setByUserId?: string) {
  await prisma.$transaction([
    prisma.match.update({ where: { id: matchId }, data: { status: MatchStatus.CONFIRMED, outcome, confirmedAt: new Date() } }),
    prisma.matchResult.upsert({
      where: { matchId },
      update: { outcome, source, setByUserId },
      create: { matchId, outcome, source, setByUserId }
    })
  ]);
}
