'use client';

import { useMemo, useState } from 'react';
import styles from '@/src/challenges/challenge.module.css';

export function PopupMazeChallenge({ onSolved }: { onSolved: (value: string) => void }) {
  const [closedCount, setClosedCount] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const list = useMemo(
    () => ['Cookie banner', 'Chat bot', 'Ad pop-up', 'Terms notice', 'Security alert', 'Promo modal'],
    [],
  );

  const handleClose = (label: string) => {
    if (selected.includes(label)) return;
    const next = [...selected, label];
    setSelected(next);
    setClosedCount(next.length);
    if (next.length >= 4) {
      onSolved(next.join(', '));
    }
  };

  return (
    <div className={styles.challenge}>
      <div className={styles.banner}>
        ป๊อปอัปปลอมกำลังแสดง: คุณต้องปิด “ทุกตัวที่สะท้อนความจริง” ให้ครบ 4 รายการเพื่อผ่านด่าน
      </div>
      <div className={styles.grid3}>
        {list.map((item) => (
          <button key={item} type="button" onClick={() => handleClose(item)} className={styles.option}>
            {item}
          </button>
        ))}
      </div>
      <div className={styles.fakePrompt}>ปิดแล้ว: {closedCount}/4</div>
    </div>
  );
}
