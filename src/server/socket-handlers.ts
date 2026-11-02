import { challengeList, type ChallengeId } from '../shared/challenges';
import { FINISH_BONUS, FINISH_LIMIT, POINTS_PER_CHALLENGE, SUBMIT_COOLDOWN_MS } from './scoring';

export type RoomStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export type PlayerState = {
  id: string;
  name: string;
  token: string;
  score: number;
  finished: boolean;
  joinedAt: number;
  lastSubmittedAt: number;
  challengesDone: ChallengeId[];
};

export type RoomState = {
  pin: string;
  status: RoomStatus;
  seed: number;
  challengeOrder: ChallengeId[];
  players: PlayerState[];
  createdAt: number;
  startAt?: number;
};

export const roomStore = new Map<string, RoomState>();
export const playerRoomById = new Map<string, string>();

export function resetRoom(pin: string) {
  const room = roomStore.get(pin);
  if (room) {
    roomStore.delete(pin);
  }

  for (const [playerId, roomPin] of Array.from(playerRoomById.entries())) {
    if (roomPin === pin) {
      playerRoomById.delete(playerId);
    }
  }
}

export function createRoom(pin: string): RoomState {
  for (const existingPin of Array.from(roomStore.keys())) {
    if (existingPin !== pin) {
      resetRoom(existingPin);
    }
  }

  const room: RoomState = {
    pin,
    status: 'LOBBY',
    seed: Date.now(),
    challengeOrder: challengeList.map((challenge) => challenge.id),
    players: [],
    createdAt: Date.now(),
  };

  roomStore.set(pin, room);
  return room;
}

export function getRoom(pin: string): RoomState | undefined {
  return roomStore.get(pin);
}

export function summarizePlayers(room: RoomState) {
  return room.players.map(({ id, name, finished }) => ({ id, name, finished }));
}

export function buildLeaderboard(room: RoomState) {
  return [...room.players]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.joinedAt - right.joinedAt;
    })
    .map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      challengesDone: player.challengesDone.length,
      finished: player.finished,
    }));
}

function applyFinishBonuses(room: RoomState) {
  const finishers = [...room.players]
    .filter((player) => player.finished)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.joinedAt - right.joinedAt;
    });

  for (const [index, player] of finishers.entries()) {
    const bonus = FINISH_BONUS[index] ?? 0;
    const current = room.players.find((entry) => entry.id === player.id);
    if (current) {
      current.score += bonus;
    }
  }
}

function maybeFinishRoom(room: RoomState) {
  if (room.status !== 'PLAYING') {
    return false;
  }

  const requiredPlayers = Math.min(FINISH_LIMIT, room.players.length || 1);
  const finishedCount = room.players.filter((player) => player.finished).length;

  if (finishedCount >= requiredPlayers) {
    applyFinishBonuses(room);
    room.status = 'FINISHED';
    return true;
  }

  return false;
}

export function registerPlayer(room: RoomState, name: string) {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    throw new Error('INVALID_NAME');
  }

  if (room.players.length >= 50) {
    throw new Error('ROOM_FULL');
  }

  const duplicate = room.players.some((player) => player.name.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) {
    throw new Error('DUPLICATE_NAME');
  }

  const playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const token = `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

  const player: PlayerState = {
    id: playerId,
    name: trimmed,
    token,
    score: 0,
    finished: false,
    joinedAt: Date.now(),
    lastSubmittedAt: 0,
    challengesDone: [],
  };

  room.players.push(player);
  playerRoomById.set(playerId, room.pin);

  return { playerId, playerToken: token };
}

export function evaluateSubmission(room: RoomState, playerId: string, challengeId: ChallengeId) {
  const player = room.players.find((entry) => entry.id === playerId);

  if (!player) {
    return {
      correct: false,
      pointsAwarded: 0,
      totalScore: 0,
      next: false,
      finished: false,
      gameEnded: false,
      error: 'PLAYER_NOT_FOUND',
    };
  }

  if (room.status !== 'PLAYING') {
    return {
      correct: false,
      pointsAwarded: 0,
      totalScore: player.score,
      next: false,
      finished: player.finished,
      gameEnded: true,
      error: 'GAME_ENDED',
    };
  }

  if (player.challengesDone.includes(challengeId)) {
    return {
      correct: false,
      pointsAwarded: 0,
      totalScore: player.score,
      next: false,
      finished: player.finished,
      gameEnded: false,
      error: 'ALREADY_COMPLETED',
    };
  }

  const now = Date.now();
  const elapsed = now - player.lastSubmittedAt;
  if (elapsed < SUBMIT_COOLDOWN_MS) {
    return {
      correct: false,
      pointsAwarded: 0,
      totalScore: player.score,
      next: false,
      finished: player.finished,
      gameEnded: false,
      error: 'TOO_FAST',
      retryAfterMs: SUBMIT_COOLDOWN_MS - elapsed,
    };
  }

  player.lastSubmittedAt = now;
  player.challengesDone.push(challengeId);
  player.score += POINTS_PER_CHALLENGE;

  const nextIndex = Math.min(player.challengesDone.length, room.challengeOrder.length);
  const isFinished = player.challengesDone.length >= room.challengeOrder.length;
  player.finished = isFinished;

  const gameEnded = maybeFinishRoom(room);

  return {
    correct: true,
    pointsAwarded: POINTS_PER_CHALLENGE,
    totalScore: player.score,
    next: nextIndex < room.challengeOrder.length,
    finished: player.finished,
    gameEnded,
    error: undefined,
  };
}
