export interface TeamNames {
  A: string;
  B: string;
}
export type TeamNamesPatch = Partial<TeamNames>;

/**
 * The names the host edited, trimmed, that differ from the last names the server sent (#133).
 * The host sends only these in `update-team-names`, so saving an edit of team A can never undo a
 * player's rename of team B. Returns null when nothing changed.
 */
export function changedTeamNames(
  serverNames: TeamNames,
  edited: Partial<Record<keyof TeamNames, string>>,
): TeamNamesPatch | null {
  const patch: TeamNamesPatch = {};
  for (const team of ['A', 'B'] as const) {
    const name = edited[team]?.trim();
    if (name !== undefined && name !== serverNames[team]) patch[team] = name;
  }
  return Object.keys(patch).length ? patch : null;
}
