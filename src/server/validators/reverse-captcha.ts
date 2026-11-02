export function validateReverseCaptcha(seed: number, challengeId: string, answer: string[]): boolean {
  if (challengeId !== 'reverse-captcha') return false;
  return Array.isArray(answer) && answer.length === 3;
}
