export type GameStatus = 'LOBBY' | 'PLAYING' | 'FINISHED';

export type PlayerSummary = {
  id: string;
  name: string;
  finished: boolean;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  challengesDone: number;
  finished: boolean;
};

export type ServerEmitEvents = {
  'players:update': { players: PlayerSummary[] };
  'game:started': { startAt: number; challengeOrder: string[]; seed: number };
  'leaderboard:update': { ranking: LeaderboardEntry[] };
  'game:ended': { myScore: number };
  'game:reset': Record<string, never>;
  'error:message': { code: string; message: string };
};

export type ClientEmitEvents = {
  'host:create': Record<string, never>;
  'host:watch': Record<string, never>;
  'host:start': Record<string, never>;
  'host:end': Record<string, never>;
  'player:join': { pin: string; name: string };
  'player:rejoin': { playerId: string; playerToken: string };
  'player:submit': { challengeId: string; answer: unknown };
};

export const SOCKET_PATH = '/api/socket-io/socket.io';
