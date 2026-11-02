'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createNewGame, getCurrentGame, type GameState } from '@/src/lib/game';
import { socket } from '@/src/lib/socket-client';

export default function HostPage() {
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);

  useEffect(() => {
    const auth = window.localStorage.getItem('host-auth');
    if (auth !== 'true') {
      router.push('/host/login');
      return;
    }

    const current = getCurrentGame();
    const next = current ?? createNewGame();
    setGame(next);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('host:watch', {}, (ack: { pin?: string; players?: Array<{ id: string; name: string; finished: boolean }> }) => {
      if (ack?.pin) {
        const nextRoom = { ...next, pin: ack.pin } as GameState;
        setGame(nextRoom);
      }
    });
  }, [router]);

  const handleCreateGame = () => {
    const next = createNewGame();
    socket.emit('host:create', {}, (ack: { pin?: string }) => {
      const created = ack?.pin ? { ...next, pin: ack.pin } : next;
      setGame(created);
      window.localStorage.setItem('ui-face-game', JSON.stringify(created));
    });
  };

  const handleLogout = async () => {
    window.localStorage.removeItem('host-auth');
    await fetch('/api/host/login', { method: 'DELETE' });
    router.push('/');
  };

  return (
    <main className="shell">
      <div className="card">
        <p className="eyebrow">Host dashboard</p>
        <h1>สร้างเกมใหม่</h1>
        {game ? (
          <>
            <p className="notice">PIN ปัจจุบัน: <strong>{game.pin}</strong></p>
            <div className="stack">
              <button type="button" className="button primary" onClick={handleCreateGame}>สร้างเกมใหม่</button>
              <Link href="/host/game" className="button secondary">เปิด lobby</Link>
              <button type="button" className="button warn" onClick={handleLogout}>ออกจากระบบ</button>
            </div>
          </>
        ) : (
          <div className="alert">ไม่พบเกม</div>
        )}
      </div>
    </main>
  );
}
