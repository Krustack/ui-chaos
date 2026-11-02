'use client';

import { useState } from 'react';
import styles from '@/src/challenges/challenge.module.css';

export function ReverseSignupChallenge({ onSolved }: { onSolved: (value: Record<string, string | boolean>) => void }) {
  const [form, setForm] = useState({
    name: 'Niran',
    birthday: '1999',
    email: 'niran@fake.com',
    agree: false,
  });

  const submit = () => {
    onSolved({
      ...form,
      email: `${form.email}`,
      agree: Boolean(form.agree),
    });
  };

  return (
    <div className={styles.challenge}>
      <div className={styles.banner}>กรอกข้อมูลตาม “ข้อมูลตัวอย่าง” ที่แสดงด้านล่าง แต่กลับด้านให้ชัดเจน</div>
      <div className={styles.fieldRow}>
        <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
        <input value={form.birthday} onChange={(e) => setForm((prev) => ({ ...prev, birthday: e.target.value }))} />
        <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
      </div>
      <label>
        <input
          type="checkbox"
          checked={form.agree}
          onChange={(e) => setForm((prev) => ({ ...prev, agree: e.target.checked }))}
        />
        ฉันไม่ยอมรับเงื่อนไข
      </label>
      <button type="button" className={styles.submit} onClick={submit}>ส่งข้อมูล</button>
    </div>
  );
}
