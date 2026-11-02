import http from 'http';
import { Server } from 'socket.io';
import { SOCKET_PATH } from '@/src/shared/events';
import {
  buildLeaderboard,
  createRoom,
  evaluateSubmission,
  getRoom,
  playerRoomById,
  registerPlayer,
  roomStore,
  summarizePlayers,
} from '@/src/server/socket-handlers';

const server = http.createServer();
const io = new Server(server, {
  path: SOCKET_PATH,
  transports: ['websocket'],
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  allowEIO3: true,
});

function emitPlayersUpdate(pin: string) {
  const room = getRoom(pin);
  if (!room) return;

  const payload = { players: summarizePlayers(room) };
  io.to(`host:${pin}`).emit('players:update', payload);
  io.to(`game:${pin}`).emit('players:update', payload);
}

function emitLeaderboard(pin: string) {
  const room = getRoom(pin);
  if (!room) return;
  io.to(`host:${pin}`).emit('leaderboard:update', { ranking: buildLeaderboard(room) });
}

function resetRoom(pin: string) {
  const room = getRoom(pin);
  if (room) {
    io.to(`game:${pin}`).emit('game:reset', {});
  }

  roomStore.delete(pin);

  for (const [playerId, roomPin] of Array.from(playerRoomById.entries())) {
    if (roomPin === pin) {
      playerRoomById.delete(playerId);
    }
  }
}

io.on('connection', (socket) => {
  socket.on('host:create', (_, ack) => {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const room = createRoom(pin);

    socket.data.pin = pin;
    socket.join(`host:${pin}`);
    socket.join(`game:${pin}`);

    emitPlayersUpdate(pin);
    emitLeaderboard(pin);
    ack?.({ pin });
  });

  socket.on('host:watch', (_, ack) => {
    const pin = socket.data.pin as string | undefined;
    if (!pin) {
      ack?.({ error: 'GAME_NOT_FOUND' });
      return;
    }

    const room = getRoom(pin);
    socket.join(`host:${pin}`);
    ack?.({ pin, players: room ? summarizePlayers(room) : [] });
  });

  socket.on('host:start', (_, ack) => {
    const pin = socket.data.pin as string | undefined;
    if (!pin) {
      ack?.({ error: 'GAME_NOT_FOUND' });
      return;
    }

    const room = getRoom(pin);
    if (!room) {
      ack?.({ error: 'GAME_NOT_FOUND' });
      return;
    }

    room.status = 'PLAYING';
    room.startAt = Date.now();
    room.seed = Date.now();

    io.to(`game:${pin}`).emit('game:started', {
      startAt: room.startAt,
      challengeOrder: room.challengeOrder,
      seed: room.seed,
    });

    ack?.({ ok: true, pin });
  });

  socket.on('host:end', (_, ack) => {
    const pin = socket.data.pin as string | undefined;
    if (!pin) {
      ack?.({ error: 'GAME_NOT_FOUND' });
      return;
    }

    const room = getRoom(pin);
    if (!room) {
      ack?.({ error: 'GAME_NOT_FOUND' });
      return;
    }

    room.status = 'FINISHED';
    io.to(`game:${pin}`).emit('game:ended', {
      myScore: room.players[0]?.score ?? 0,
    });
    emitLeaderboard(pin);
    ack?.({ ok: true });
  });

  socket.on('player:join', ({ pin, name }, ack) => {
    const safePin = String(pin ?? '').trim();
    const safeName = String(name ?? '').trim();

    if (!safePin || safeName.length === 0 || safeName.length > 20) {
      ack?.({ error: 'INVALID_NAME' });
      return;
    }

    const room = getRoom(safePin);
    if (!room) {
      ack?.({ error: 'INVALID_PIN' });
      return;
    }

    try {
      const { playerId, playerToken } = registerPlayer(room, safeName);
      socket.data.pin = room.pin;
      socket.data.playerId = playerId;
      socket.data.playerToken = playerToken;
      socket.join(`game:${room.pin}`);

      emitPlayersUpdate(room.pin);
      emitLeaderboard(room.pin);
      ack?.({ playerId, playerToken });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'INVALID_REQUEST';
      ack?.({ error: code });
    }
  });

  socket.on('player:rejoin', ({ playerId, playerToken }, ack) => {
    if (!playerId || !playerToken) {
      ack?.({ error: 'INVALID_SESSION' });
      return;
    }

    const pin = playerRoomById.get(String(playerId));
    if (!pin) {
      ack?.({ error: 'SESSION_NOT_FOUND' });
      return;
    }

    const room = getRoom(pin);
    const player = room?.players.find((entry) => entry.id === String(playerId));
    if (!room || !player || player.token !== String(playerToken)) {
      ack?.({ error: 'INVALID_SESSION' });
      return;
    }

    socket.data.pin = pin;
    socket.data.playerId = player.id;
    socket.data.playerToken = player.token;
    socket.join(`game:${pin}`);

    ack?.({
      playerId: player.id,
      playerToken: player.token,
      score: player.score,
      totalScore: player.score,
      completed: player.challengesDone,
      status: room.status,
    });
  });

  socket.on('player:submit', ({ challengeId, answer }, ack) => {
    const pin = socket.data.pin as string | undefined;
    const playerId = socket.data.playerId as string | undefined;

    if (!pin || !playerId) {
      ack?.({ error: 'GAME_NOT_FOUND' });
      return;
    }

    const room = getRoom(pin);
    if (!room) {
      ack?.({ error: 'GAME_NOT_FOUND' });
      return;
    }

    const result = evaluateSubmission(room, playerId, String(challengeId) as any);

    if (result.error) {
      ack?.({
        error: result.error,
        correct: false,
        pointsAwarded: 0,
        totalScore: result.totalScore,
        next: false,
        retryAfterMs: result.retryAfterMs ?? 0,
      });
      return;
    }

    if (result.gameEnded) {
      io.to(`game:${pin}`).emit('game:ended', {
        myScore: room.players.find((player) => player.id === playerId)?.score ?? 0,
      });
    }

    emitPlayersUpdate(pin);
    emitLeaderboard(pin);

    ack?.({
      correct: result.correct,
      pointsAwarded: result.pointsAwarded,
      totalScore: result.totalScore,
      next: result.next,
      finished: result.finished,
      gameEnded: result.gameEnded,
    });
  });

  socket.on('disconnect', () => {
    const pin = socket.data.pin as string | undefined;
    if (pin) {
      const room = getRoom(pin);
      if (room) {
        emitPlayersUpdate(pin);
        emitLeaderboard(pin);
      }
    }
  });
});

export default server;
