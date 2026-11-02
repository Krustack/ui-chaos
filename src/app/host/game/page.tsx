'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { endGame, getCurrentGame, getLeaderboard, startGame, type GameState } from '@/src/lib/game';
import { socket } from '@/src/lib/socket-client';

export default function HostGamePage() {
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);
  const [livePlayers, setLivePlayers] = useState<Array<{ id: string; name: string; finished: boolean }>>([]);
  const [liveLeaderboard, setLiveLeaderboard] = useState<Array<{ id: string; name: string; score: number; challengesDone: number; finished: boolean }>>([]);

  useEffect(() => {
    const auth = window.localStorage.getItem('host-auth');
    if (auth !== 'true') {
      router.push('/host/login');
      return;
    }

    const current = getCurrentGame();
    if (!current) {
      router.push('/host');
      return;
    }
    setGame(current);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('host:watch', {}, (ack: { pin?: string; players?: Array<{ id: string; name: string; finished: boolean }> }) => {
      if (ack?.pin) {
        setGame((prev) => {
          const safePin = ack.pin ?? (prev ?? current).pin;
          return { ...(prev ?? current), pin: safePin };
        });
      }
    });

    socket.on('players:update', ({ players }) => {
      setLivePlayers(players);
    });

    socket.on('leaderboard:update', ({ ranking }) => {
      setLiveLeaderboard(ranking);
    });

    socket.on('game:started', ({ startAt, challengeOrder }) => {
      setGame((prev) => (prev ? { ...prev, status: 'PLAYING', startAt, challengeOrder } : prev));
    });

    socket.on('game:ended', () => {
      setGame((prev) => (prev ? { ...prev, status: 'FINISHED' } : prev));
    });

    const updateGame = () => {
      const currentState = getCurrentGame();
      if (currentState) setGame(currentState);
    };

    window.addEventListener('storage', updateGame);
    return () => {
      window.removeEventListener('storage', updateGame);
      socket.off('players:update');
      socket.off('leaderboard:update');
      socket.off('game:started');
      socket.off('game:ended');
    };
  }, [router]);

  const leaderboard = useMemo(() => (liveLeaderboard.length > 0 ? liveLeaderboard : (game ? getLeaderboard(game) : [])), [game, liveLeaderboard]);

  const handleStart = () => {
    if (!game) return;
    socket.emit('host:start', {}, () => {
      setGame((prev) => (prev ? { ...prev, status: 'PLAYING' } : prev));
    });
    setGame(startGame());
  };

  const handleEnd = () => {
    if (!game) return;
    socket.emit('host:end', {}, () => {
      setGame((prev) => (prev ? { ...prev, status: 'FINISHED' } : prev));
    });
    setGame(endGame());
  };

  if (!game) {
    return <main className="shell"><div className="card"><p>Loading game…</p></div></main>;
  }

  return (
    <main className="shell">
      <div className="card">
        <p className="eyebrow">Host room</p>
        <h1>PIN: {game.pin}</h1>
        <p className="notice">สถานะ: {game.status}</p>

        <div className="row">
          <button type="button" className="button primary" onClick={handleStart}>เริ่มเกม</button>
          <button type="button" className="button warn" onClick={handleEnd}>จบเกม</button>
          <Link href="/host" className="button secondary">กลับ dashboard</Link>
        </div>

        <div className="grid" style={{ marginTop: '2rem' }}>
          <div>
            <h3>ผู้เล่น</h3>
            <div className="scoreboard">
              {(livePlayers.length > 0 ? livePlayers : game.players).length === 0 ? <p className="notice">ยังไม่มีผู้เล่น</p> : null}
              {(livePlayers.length > 0 ? livePlayers : game.players).map((player) => (
                <div key={player.id} className="score-row">
                  <span>{player.name}</span>
                  <strong>{player.finished ? 'เสร็จ' : 'กำลังเล่น'}</strong>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3>Leaderboard</h3>
            <div className="scoreboard">
              {leaderboard.map((player, index) => (
                <div key={player.id} className="score-row">
                  <span>#{index + 1} {player.name}</span>
                  <strong>{player.score}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
