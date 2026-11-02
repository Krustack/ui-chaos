'use client';

import { useState } from 'react';
import styles from '@/src/challenges/challenge.module.css';

export function PasswordRulesChallenge({ onSolved }: { onSolved: (value: string) => void }) {
  const [password, setPassword] = useState('');

  return (
    <div className={styles.challenge}>
      <div className={styles.banner}>ตั้งรหัสผ่านให้ตรงกับกติกาและ “ไม่ใช่สิ่งที่คนชอบ”</div>
      <ul>
        <li>ต้องมีความยาว 8-16</li>
        <li>ต้องมีตัวเลขอย่างน้อย 1</li>
        <li>ต้องมีอักขระพิเศษอย่างน้อย 1</li>
        <li>ต้องไม่ใช้คำว่า &quot;password&quot;</li>
      </ul>
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="กรอกรหัสผ่าน" />
      <button type="button" className={styles.submit} onClick={() => onSolved(password)}>
        ตรวจรหัส
      </button>
    </div>
  );
}
