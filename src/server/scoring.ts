export const STAGE_COUNT = 5;
export const POINTS_PER_CHALLENGE = 10;
export const FINISH_LIMIT = 5;
export const FINISH_BONUS = [5, 4, 3, 2, 1] as const;
export const SUBMIT_COOLDOWN_MS = 1500;

export function calculateTotalScore(challengesDone: number, finishedRank?: number) {
  const challengeScore = challengesDone * POINTS_PER_CHALLENGE;
  const bonus = finishedRank && finishedRank <= FINISH_BONUS.length ? FINISH_BONUS[finishedRank - 1] : 0;
  return challengeScore + bonus;
}
