/** The host's pick of who may buzz per team (#23). `null` means anyone on that team. */
export type BuzzerPlayers = { A: string | null; B: string | null };

export type TeamKey = 'A' | 'B';

/** Everyone may buzz: the state after Skip, and the reset state. */
export const NO_BUZZER_PICKS: BuzzerPlayers = { A: null, B: null };

/** The selected buzzer of a team, or null when the team has no pick. */
export function buzzerOwner(team: TeamKey, picks: BuzzerPlayers | null | undefined): string | null {
  return picks?.[team] || null;
}

/** Whether `playerName` on `team` may buzz. A team without a pick is unrestricted. */
export function canBuzz(
  team: TeamKey,
  playerName: string,
  picks: BuzzerPlayers | null | undefined,
): boolean {
  const owner = buzzerOwner(team, picks);
  return !owner || owner === playerName;
}

/** What decides whether a player sees the buzzer (#141). */
export type BuzzerVisibilityState = {
  /** The team the player joined; '' for a spectator or before joining. */
  selectedTeam: string;
  /** The buzzer round has started (multiplier set, step reached). */
  roundOn: boolean;
  /** The host has picked who starts, which ends the buzzer round. */
  startingTeamSet: boolean;
  /** Answers guessed so far; the buzzer is only for before the first one. */
  guessedCount: number;
};

/**
 * Whether the buzzer shows in `team`'s panel. TeamDisplay and TeamPanel used to repeat this rule;
 * keep it here so the panels and the phone's fixed bottom bar cannot disagree.
 */
export function isBuzzerVisible(team: TeamKey, state: BuzzerVisibilityState): boolean {
  return (
    state.roundOn &&
    state.selectedTeam === team &&
    !state.startingTeamSet &&
    state.guessedCount === 0
  );
}

/** Whether the phone's fixed buzzer bar shows at all (the page leaves room for it). */
export function isBuzzerBarShown(state: BuzzerVisibilityState): boolean {
  return isBuzzerVisible('A', state) || isBuzzerVisible('B', state);
}

/** Whether any team has a selected buzzer. */
export function hasAnyPick(picks: BuzzerPlayers | null | undefined): boolean {
  return !!(picks?.A || picks?.B);
}

/** Whether a picked name is still on the team (a disconnect removes players from teamMembers). */
export function isPickConnected(name: string, members: string[] | null | undefined): boolean {
  return !!members?.includes(name);
}
