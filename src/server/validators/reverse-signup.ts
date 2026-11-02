export function validateReverseSignup(seed: number, challengeId: string, answer: Record<string, string | boolean>): boolean {
  if (challengeId !== 'reverse-signup') return false;
  const name = String(answer.name ?? '').trim().toLowerCase();
  const birthday = String(answer.birthday ?? '').trim();
  const email = String(answer.email ?? '').trim().toLowerCase();
  const agreed = Boolean(answer.agree);
  return name.length > 0 && birthday.length > 0 && email.includes('@') && agreed === false;
}
