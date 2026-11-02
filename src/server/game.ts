import { FINISH_BONUS, FINISH_LIMIT, POINTS_PER_CHALLENGE, STAGE_COUNT } from '@/src/server/scoring';

export type GameStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export type PlayerRecord = {
  id: string;
  name: string;
  token: string;
  joinedAt: number;
  finished: boolean;
  score: number;
  challengeIds: string[];
};

export type GameRecord = {
  pin: string;
  status: GameStatus;
  createdAt: number;
  startAt?: number;
  seed: number;
  players: PlayerRecord[];
  challengeOrder: string[];
};

export function createSeed() {
  return Math.floor(Math.random() * 1000000);
}

export function generatePin() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export function buildChallengeOrder() {
  return ['popup-maze', 'reverse-signup', 'reverse-captcha', 'password-rules', 'final-boss'];
}

export function resetGame() {
  return {
    pin: '',
    status: 'LOBBY' as const,
    createdAt: Date.now(),
    seed: createSeed(),
    players: [],
    challengeOrder: buildChallengeOrder(),
  } satisfies GameRecord;
}

export function awardChallenge(game: GameRecord, playerId: string, challengeId: string) {
  const updated = game.players.map((player) => {
    if (player.id !== playerId) return player;
    if (player.challengeIds.includes(challengeId)) return player;

    const challengeDone = [...player.challengeIds, challengeId];
    const nextScore = player.score + POINTS_PER_CHALLENGE;
    return {
      ...player,
      challengeIds: challengeDone,
      score: nextScore,
      finished: challengeDone.length >= STAGE_COUNT,
    };
  });

  const finishers = updated.filter((player) => player.finished).length;
  const next = { ...game, players: updated } satisfies GameRecord;

  if (finishers >= Math.min(FINISH_LIMIT, updated.length)) {
    return {
      ...next,
      status: 'FINISHED' as const,
    };
  }

  return next;
}

export function applyFinishBonus(game: GameRecord) {
  const sorted = [...game.players]
    .filter((player) => player.finished)
    .sort((a, b) => b.score - a.score)
    .map((player, index) => {
      const bonus = index < FINISH_BONUS.length ? FINISH_BONUS[index] : 0;
      return {
        ...player,
        score: player.score + bonus,
      };
    });

  const players = game.players.map((player) => {
    const bonusPlayer = sorted.find((entry) => entry.id === player.id);
    return bonusPlayer ?? player;
  });

  return {
    ...game,
    players,
    status: 'FINISHED' as const,
  } satisfies GameRecord;
}
