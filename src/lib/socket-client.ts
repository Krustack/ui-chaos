import { io, Socket } from 'socket.io-client';
import { SOCKET_PATH } from '@/src/shared/events';

export const socket: Socket = io({
  path: SOCKET_PATH,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  autoConnect: true,
});

socket.on('connect', () => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('player-session');
    if (saved) {
      const parsed = JSON.parse(saved) as { playerId: string; playerToken: string };
      socket.emit('player:rejoin', {
        playerId: parsed.playerId,
        playerToken: parsed.playerToken,
      });
    }
  }
});

export function ensureSocketConnected() {
  if (!socket.connected) {
    socket.connect();
  }
}
