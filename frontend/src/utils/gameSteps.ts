/**
 * The host's game steps (#17). `currentStep` in the game state is one of these numbers.
 * The values are what the backend stores, so keep them stable; ORDER defines the flow
 * and the step bar. Adding a step means adding it to GameStep and to GAME_STEP_ORDER, and
 * renumbering the values (#23 inserted SelectBuzzers before Buzzer, so Buzzer is now 5).
 */
export const GameStep = {
  Start: 1,
  QA: 2,
  Multiplier: 3,
  SelectBuzzers: 4,
  Buzzer: 5,
  WhoStarts: 6,
  Guessing: 7,
  Award: 8,
} as const;

export type GameStepValue = (typeof GameStep)[keyof typeof GameStep];

/** Steps in the order the host moves through them, with their step-bar labels. */
export const GAME_STEP_ORDER: ReadonlyArray<{ step: GameStepValue; label: string }> = [
  { step: GameStep.Start, label: 'Start' },
  { step: GameStep.QA, label: 'Q&A' },
  { step: GameStep.Multiplier, label: 'Multiplier' },
  { step: GameStep.SelectBuzzers, label: 'Buzzers' },
  { step: GameStep.Buzzer, label: 'Buzzer' },
  { step: GameStep.WhoStarts, label: 'Who Starts' },
  { step: GameStep.Guessing, label: 'Guessing' },
  { step: GameStep.Award, label: 'Award' },
];

/** The step right before `step` in the flow, or null for the first step or an unknown value. */
export function stepBefore(step: number): number | null {
  const index = GAME_STEP_ORDER.findIndex((s) => s.step === step);
  return index > 0 ? GAME_STEP_ORDER[index - 1].step : null;
}
