export function validatePasswordRules(seed: number, challengeId: string, answer: string): boolean {
  if (challengeId !== 'password-rules') return false;
  if (typeof answer !== 'string') return false;
  if (answer.toLowerCase().includes('password')) return false;
  return answer.length >= 8 && answer.length <= 16 && /\d/.test(answer) && /[^A-Za-z0-9]/.test(answer);
}
