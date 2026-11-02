'use client';

import { useState } from 'react';
import styles from '@/src/challenges/challenge.module.css';

export function FinalBossChallenge({ onSolved }: { onSolved: (value: { code: string; slider: number; checks: string[] }) => void }) {
  const [code, setCode] = useState('');
  const [slider, setSlider] = useState(50);
  const [checks, setChecks] = useState<string[]>([]);

  const toggle = (label: string) => {
    setChecks((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  };

  return (
    <div className={styles.challenge}>
      <div className={styles.banner}>ยืนยันว่าคุณไม่ใช่หุ่นยนต์: พิมพ์โค้ด 8 ตัว, เลื่อนสไลด์ตามค่าที่ถูกต้อง, และติ๊กตัวเลือกที่สอดคล้อง</div>
      <input value={code} maxLength={8} onChange={(e) => setCode(e.target.value)} placeholder="8-character code" />
      <input type="range" min={0} max={100} value={slider} onChange={(e) => setSlider(Number(e.target.value))} />
      <div className={styles.inlineRow}>
        {['โปรดอย่าติ๊ก', 'ไม่ใช่หุ่นยนต์', 'เลือกสิ่งที่ผิด'].map((label) => (
          <label key={label}>
            <input type="checkbox" checked={checks.includes(label)} onChange={() => toggle(label)} />
            {label}
          </label>
        ))}
      </div>
      <button
        type="button"
        className={styles.submit}
        onClick={() => onSolved({ code, slider, checks })}
      >
        ส่งคำตอบ
      </button>
    </div>
  );
}
