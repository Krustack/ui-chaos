import { io, Socket } from 'socket.io-client';
import { SOCKET_PATH } from '@/src/shared/events';

const socketUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const socket: Socket = io(socketUrl, {
  path: SOCKET_PATH,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  autoConnect: true,
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
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
