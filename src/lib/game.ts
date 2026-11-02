import { challengeList, FINISH_BONUS, FINISH_LIMIT, POINTS_PER_CHALLENGE, type ChallengeId, STAGE_COUNT } from '@/src/shared/challenges';

export type GameStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export type Player = {
  id: string;
  name: string;
  score: number;
  completed: ChallengeId[];
  finished: boolean;
  joinedAt: number;
};

export type GameState = {
  pin: string;
  status: GameStatus;
  createdAt: number;
  startAt?: number;
  players: Player[];
  challengeOrder: ChallengeId[];
  finalRanking: Player[];
};

const STORAGE_KEY = 'ui-face-game';

export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createChallengeOrder(): ChallengeId[] {
  return [...challengeList].sort(() => Math.random() - 0.5).map((item) => item.id);
}

export function getCurrentGame(): GameState | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as GameState) : null;
}

export function saveCurrentGame(game: GameState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
}

export function resetGameState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function createNewGame(): GameState {
  const game: GameState = {
    pin: generatePin(),
    status: 'LOBBY',
    createdAt: Date.now(),
    players: [],
    challengeOrder: [...challengeList.map((item) => item.id)],
    finalRanking: [],
  };
  saveCurrentGame(game);
  return game;
}

export function joinGame(pin: string, name: string): { playerId: string; game: GameState } {
  const game = getCurrentGame();
  if (!game || game.pin !== pin) {
    throw new Error('INVALID_PIN');
  }

  const existing = game.players.find((player) => player.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) {
    throw new Error('DUPLICATE_NAME');
  }

  if (game.players.length >= 50) {
    throw new Error('ROOM_FULL');
  }

  const playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const player: Player = {
    id: playerId,
    name: name.trim(),
    score: 0,
    completed: [],
    finished: false,
    joinedAt: Date.now(),
  };

  const nextGame = { ...game, players: [...game.players, player] };
  saveCurrentGame(nextGame);

  return { playerId, game: nextGame };
}

export function startGame(): GameState {
  const game = getCurrentGame();
  if (!game) throw new Error('GAME_NOT_FOUND');

  const nextGame: GameState = {
    ...game,
    status: 'PLAYING',
    startAt: Date.now(),
    challengeOrder: createChallengeOrder(),
    finalRanking: [],
  };
  saveCurrentGame(nextGame);
  return nextGame;
}

export function endGame(): GameState {
  const game = getCurrentGame();
  if (!game) throw new Error('GAME_NOT_FOUND');

  const ranking = [...game.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.joinedAt - b.joinedAt;
  });
  const nextGame: GameState = {
    ...game,
    status: 'FINISHED',
    finalRanking: ranking,
  };
  saveCurrentGame(nextGame);
  return nextGame;
}

export function getPlayerById(game: GameState, playerId: string): Player | undefined {
  return game.players.find((player) => player.id === playerId);
}

export function awardChallenge(game: GameState, playerId: string, challengeId: ChallengeId): GameState {
  const player = getPlayerById(game, playerId);
  if (!player) return game;

  const alreadyDone = player.completed.includes(challengeId);
  if (alreadyDone) return game;

  const nextPlayers = game.players.map((entry) => {
    if (entry.id !== playerId) return entry;

    const scoreDelta = POINTS_PER_CHALLENGE;
    const completed = [...entry.completed, challengeId];
    const finished = completed.length >= STAGE_COUNT;
    const nextScore = entry.score + scoreDelta;

    return {
      ...entry,
      completed,
      finished,
      score: nextScore,
    };
  });

  const nextGame = {
    ...game,
    players: nextPlayers,
  };

  const finishers = nextPlayers.filter((entry) => entry.finished).length;
  if (finishers >= Math.min(FINISH_LIMIT, nextPlayers.length)) {
    return endGameWithState(nextGame);
  }

  saveCurrentGame(nextGame);
  return nextGame;
}

export function endGameWithState(game: GameState): GameState {
  const ranking = [...game.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.joinedAt - b.joinedAt;
  });
  const next: GameState = { ...game, status: 'FINISHED', finalRanking: ranking };
  saveCurrentGame(next);
  return next;
}

export function applyFinishBonus(game: GameState): GameState {
  const ranking = [...game.players]
    .filter((player) => player.finished)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.joinedAt - b.joinedAt;
    });

  const ranked = ranking.map((player, index) => {
    const bonus = index < FINISH_BONUS.length ? FINISH_BONUS[index] : 0;
    const nextScore = player.score + bonus;
    return { ...player, score: nextScore };
  });

  const reshaped = game.players.map((player) => {
    const updated = ranked.find((entry) => entry.id === player.id);
    return updated ?? player;
  });

  const finalGame: GameState = { ...game, players: reshaped };
  saveCurrentGame(finalGame);
  return finalGame;
}

export function getLeaderboard(game: GameState): Array<{ id: string; name: string; score: number; completed: number; finished: boolean }> {
  return [...game.players]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.joinedAt - b.joinedAt;
    })
    .map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      completed: player.completed.length,
      finished: player.finished,
    }));
}

export const defaultState: GameState = {
  pin: '000000',
  status: 'LOBBY',
  createdAt: Date.now(),
  players: [],
  challengeOrder: challengeList.map((item) => item.id),
  finalRanking: [],
};
