'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HostLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const response = await fetch('/api/host/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setError('รหัสผ่านไม่ถูกต้อง');
      return;
    }

    window.localStorage.setItem('host-auth', 'true');
    router.push('/host');
  };

  return (
    <main className="shell">
      <div className="card">
        <p className="eyebrow">Host login</p>
        <h1>เข้าสู่ระบบ Host</h1>
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <div className="alert">{error}</div>}

          <div className="row">
            <button type="submit" className="button primary">เข้าสู่ระบบ</button>
            <Link href="/" className="button secondary">กลับหน้าแรก</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
