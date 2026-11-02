export function validateFinalBoss(seed: number, challengeId: string, answer: { code?: string; slider?: number; checks?: string[] }): boolean {
  if (challengeId !== 'final-boss') return false;
  const code = answer?.code ?? '';
  const slider = Number(answer?.slider ?? 0);
  const checks = Array.isArray(answer?.checks) ? answer.checks : [];
  return code.length === 8 && slider >= 30 && slider <= 70 && checks.includes('ไม่ใช่หุ่นยนต์');
}
