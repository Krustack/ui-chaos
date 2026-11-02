'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { joinGame } from '@/src/lib/game';
import { socket } from '@/src/lib/socket-client';

export default function JoinPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedPin = pin.trim();
    const trimmedName = name.trim();

    try {
      const result = joinGame(trimmedPin, trimmedName);
      const session = {
        playerId: result.playerId,
        playerToken: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        pin: result.game.pin,
        name: trimmedName,
      };

      socket.emit('player:join', { pin: trimmedPin, name: trimmedName }, (ack: { error?: string; playerId?: string; playerToken?: string }) => {
        if (ack?.error) {
          setError(ack.error);
          return;
        }

        if (ack?.playerId && ack?.playerToken) {
          session.playerId = ack.playerId;
          session.playerToken = ack.playerToken;
        }

        window.localStorage.setItem('player-session', JSON.stringify(session));
        router.push('/play');
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <main className="shell">
      <div className="card">
        <p className="eyebrow">Join game</p>
        <h1>กรอก PIN และชื่อเล่น</h1>
        <form className="form" onSubmit={handleSubmit}>
          <div className="row">
            <div className="field">
              <label htmlFor="pin">PIN</label>
              <input id="pin" value={pin} maxLength={6} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="field">
              <label htmlFor="name">ชื่อเล่น</label>
              <input id="name" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          {error && <div className="alert">{error}</div>}

          <div className="row">
            <button type="submit" className="button primary">เข้าร่วม</button>
            <Link href="/" className="button secondary">กลับหน้าแรก</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
