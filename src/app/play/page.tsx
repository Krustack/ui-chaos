'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PopupMazeChallenge } from '@/src/challenges/popup-maze';
import { ReverseSignupChallenge } from '@/src/challenges/reverse-signup';
import { ReverseCaptchaChallenge } from '@/src/challenges/reverse-captcha';
import { PasswordRulesChallenge } from '@/src/challenges/password-rules';
import { FinalBossChallenge } from '@/src/challenges/final-boss';
import { awardChallenge, getCurrentGame, getPlayerById, type GameState } from '@/src/lib/game';
import { socket } from '@/src/lib/socket-client';
import { challengeList, type ChallengeId } from '@/src/shared/challenges';
import { validatePopupMaze } from '@/src/server/validators/popup-maze';
import { validateReverseSignup } from '@/src/server/validators/reverse-signup';
import { validateReverseCaptcha } from '@/src/server/validators/reverse-captcha';
import { validatePasswordRules } from '@/src/server/validators/password-rules';

const validatorMap: Record<ChallengeId, (seed: number, challengeId: string, answer: unknown) => boolean> = {
  'popup-maze': ((seed, challengeId, answer) => validatePopupMaze(seed, challengeId, String(answer))) as (
    seed: number,
    challengeId: string,
    answer: unknown,
  ) => boolean,
  'reverse-signup': ((seed, challengeId, answer) => validateReverseSignup(seed, challengeId, answer as Record<string, string | boolean>)) as (
    seed: number,
    challengeId: string,
    answer: unknown,
  ) => boolean,
  'reverse-captcha': ((seed, challengeId, answer) => validateReverseCaptcha(seed, challengeId, answer as string[])) as (
    seed: number,
    challengeId: string,
    answer: unknown,
  ) => boolean,
  'password-rules': ((seed, challengeId, answer) => validatePasswordRules(seed, challengeId, String(answer))) as (
    seed: number,
    challengeId: string,
    answer: unknown,
  ) => boolean,
  'final-boss': (_seed, _id, answer) => {
    const payload = answer as { code?: string; slider?: number; checks?: string[] } | undefined;
    const code = payload?.code ?? '';
    const slider = payload?.slider ?? 0;
    const checks = payload?.checks ?? [];
    return typeof code === 'string' && code.length === 8 && slider >= 30 && slider <= 70 && checks.includes('ไม่ใช่หุ่นยนต์');
  },
};

const challengeComponentMap = {
  'popup-maze': PopupMazeChallenge,
  'reverse-signup': ReverseSignupChallenge,
  'reverse-captcha': ReverseCaptchaChallenge,
  'password-rules': PasswordRulesChallenge,
  'final-boss': FinalBossChallenge,
} as const;

export default function PlayPage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [session, setSession] = useState<{ playerId: string; playerToken?: string; pin: string; name: string } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const syncSession = () => {
      const raw = window.localStorage.getItem('player-session');
      if (!raw) return;
      const parsed = JSON.parse(raw) as { playerId: string; playerToken?: string; pin: string; name: string };
      setSession(parsed);
      setGame(getCurrentGame());
    };

    syncSession();
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('game:started', ({ startAt, challengeOrder }) => {
      setGame((prev) => (prev ? { ...prev, status: 'PLAYING', startAt, challengeOrder } : prev));
    });

    socket.on('game:ended', () => {
      setGame((prev) => (prev ? { ...prev, status: 'FINISHED' } : prev));
    });

    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener('storage', syncSession);
      socket.off('game:started');
      socket.off('game:ended');
    };
  }, []);

  const player = useMemo(() => {
    if (!game || !session) return null;
    return getPlayerById(game, session.playerId);
  }, [game, session]);

  useEffect(() => {
    if (!game || !player) return;
    setCurrentIndex(Math.min(player.completed.length, game.challengeOrder.length - 1));
  }, [game, player]);

  const currentChallenge = game?.challengeOrder[currentIndex] ?? challengeList[0].id;
  const CurrentChallengeComponent = challengeComponentMap[currentChallenge];

  const handleSolved = (answer: unknown) => {
    if (!session || !game) return;
    const validator = validatorMap[currentChallenge];
    const valid = validator(1, currentChallenge, answer);

    if (!valid) {
      setMessage('คำตอบยังไม่ถูกต้อง ลองอีกครั้ง');
      return;
    }

    const nextGame = awardChallenge(game, session.playerId, currentChallenge);
    const updated = nextGame ?? game;
    setGame(updated);
    setMessage('ผ่านด่านแล้ว!');

    const nextIndex = currentIndex + 1;
    if (nextIndex < updated.challengeOrder.length) {
      setCurrentIndex(nextIndex);
    }
  };

  if (!session) {
    return (
      <main className="shell">
        <div className="card centered">
          <h1>ยังไม่ได้เข้าห้อง</h1>
          <p className="lead">กรอก PIN และชื่อเล่นก่อนเริ่มเล่น</p>
          <div className="stack">
            <Link href="/join" className="button primary">ไปหน้า Join</Link>
            <Link href="/" className="button secondary">กลับหน้าแรก</Link>
          </div>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="shell">
        <div className="card">
          <p className="eyebrow">Waiting</p>
          <h1>กำลังโหลดห้องเกม</h1>
          <Link href="/join" className="button secondary">ไปหน้า Join</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="card">
        <p className="eyebrow">Player</p>
        <h1>{session.name}</h1>
        <p className="notice">PIN: {game.pin} • คะแนน: {player?.score ?? 0}</p>

        {message && <div className="alert">{message}</div>}

        {game.status !== 'PLAYING' ? (
          <div className="challengeBox">
            <h3>เกมยังไม่เริ่ม หรือเกมจบแล้ว</h3>
            <p>รอผู้เล่นคนอื่นหรือ Host เริ่มเกมใหม่</p>
            <Link href="/join" className="button secondary">กลับเข้าห้อง</Link>
          </div>
        ) : (
          <div className="challengeBox">
            <span className="tag">ด่าน {currentIndex + 1}</span>
            <h3>{challengeList.find((item) => item.id === currentChallenge)?.title}</h3>
            <CurrentChallengeComponent onSolved={handleSolved} />
          </div>
        )}
      </div>
    </main>
  );
}
