export function validatePopupMaze(seed: number, challengeId: string, answer: string): boolean {
  return challengeId === 'popup-maze' && answer.length > 0 && answer.toLowerCase().includes('cookie') && answer.toLowerCase().includes('chat');
}
