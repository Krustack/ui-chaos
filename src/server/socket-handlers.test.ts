import { afterEach, describe, expect, it, vi } from 'vitest';
import { challengeList } from '../shared/challenges';
import { SUBMIT_COOLDOWN_MS } from './scoring';
import { createRoom, evaluateSubmission, getRoom, playerRoomById, registerPlayer, resetRoom } from './socket-handlers';

describe('socket room flow', () => {
  afterEach(() => {
    vi.useRealTimers();
    playerRoomById.clear();
  });

  it('awards points once per challenge and ends the room after five finishers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const room = createRoom('123456');
    room.status = 'PLAYING';

    const players = ['Alice', 'Bob', 'Cara', 'Drew', 'Eve'].map((name) => registerPlayer(room, name));
    const challengeOrder = challengeList.map((item) => item.id);

    for (const player of players) {
      for (const challengeId of challengeOrder) {
        vi.setSystemTime(new Date(Date.now() + SUBMIT_COOLDOWN_MS + 50));
        const result = evaluateSubmission(room, player.playerId, challengeId);
        expect(result.correct).toBe(true);
      }
    }

    expect(getRoom(room.pin)?.status).toBe('FINISHED');
    expect(room.players.every((player) => player.finished)).toBe(true);
  });

  it('clears the previous room before creating a new one', () => {
    const oldRoom = createRoom('111111');
    const { playerId } = registerPlayer(oldRoom, 'Alice');

    const nextRoom = createRoom('222222');
    expect(getRoom('111111')).toBeUndefined();
    expect(playerRoomById.has(playerId)).toBe(false);
    expect(nextRoom.pin).toBe('222222');
    resetRoom('222222');
    expect(getRoom('222222')).toBeUndefined();
  });
});
