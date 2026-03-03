export type Standing = { playerId: string; points: number; opponents: string[] };
export type PairingResult = { player1Id: string; player2Id: string | null; bye: boolean }[];

/**
 * Swiss-like pairing for MVP:
 * 1) sort by points desc
 * 2) pair within score groups when possible
 * 3) float to adjacent group if repeat collision
 * 4) last odd player gets bye (1 point default at scoring stage)
 */
export function swissLikePairings(standings: Standing[]): PairingResult {
  const sorted = [...standings].sort((a, b) => b.points - a.points);
  const used = new Set<string>();
  const out: PairingResult = [];

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    if (used.has(a.playerId)) continue;

    let partner = sorted.find(
      (b) => !used.has(b.playerId) && b.playerId !== a.playerId && !a.opponents.includes(b.playerId)
    );

    if (!partner) {
      partner = sorted.find((b) => !used.has(b.playerId) && b.playerId !== a.playerId);
    }

    if (!partner) {
      used.add(a.playerId);
      out.push({ player1Id: a.playerId, player2Id: null, bye: true });
      continue;
    }

    used.add(a.playerId);
    used.add(partner.playerId);
    out.push({ player1Id: a.playerId, player2Id: partner.playerId, bye: false });
  }

  return out;
}
