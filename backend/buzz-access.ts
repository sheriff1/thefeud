export type BuzzerPlayers = { A: string | null; B: string | null };
export type TeamMembers = { A: string[]; B: string[] };

/**
 * Whether `name` may buzz given the host's buzzer assignment (#23).
 *
 * This is a consistency check, not security: the server cannot tell who really sent the name
 * (docs/api.md, quirk 1). It rejects a buzz from a member of a team whose selected buzzer is
 * someone else, which catches stale tabs and races after the host changes a pick.
 *
 * - No assignment, or both entries null (the host skipped): anyone may buzz, as before.
 * - The selected buzzer of either team may always buzz.
 * - A member of a team that has a selected buzzer may not buzz unless they are that buzzer.
 * - A team without a pick, and names that are on neither team, are not restricted.
 */
export function isBuzzAllowed(
  name: string,
  buzzerPlayers: BuzzerPlayers | null | undefined,
  teamMembers: TeamMembers | null | undefined,
): boolean {
  if (!buzzerPlayers) return true;
  if (name === buzzerPlayers.A || name === buzzerPlayers.B) return true;
  for (const team of ['A', 'B'] as const) {
    if (buzzerPlayers[team] && teamMembers?.[team]?.includes(name)) return false;
  }
  return true;
}
