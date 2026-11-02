'use client';

import { useState } from 'react';
import styles from '@/src/challenges/challenge.module.css';

const symbols = ['🍉', '🍎', '🍊', '🍍', '🍇', '🍋'];

export function ReverseCaptchaChallenge({ onSolved }: { onSolved: (value: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (value: string) => {
    setSelected((current) => {
      const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      if (next.length === 3) {
        onSolved(next);
      }
      return next;
    });
  };

  return (
    <div className={styles.challenge}>
      <div className={styles.banner}>เลือกทุกช่องที่ไม่ใช่ผลไม้ • ให้เลือก 3 ช่อง</div>
      <div className={styles.grid3}>
        {symbols.map((symbol) => (
          <button
            key={symbol}
            type="button"
            className={`${styles.option} ${selected.includes(symbol) ? styles.selected : ''}`}
            onClick={() => toggle(symbol)}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
