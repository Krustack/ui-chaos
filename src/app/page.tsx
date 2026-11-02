import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="shell">
      <div className="card centered">
        <p className="eyebrow">User Inyerface • multiplayer</p>
        <h1>Play or host the chaos</h1>
        <p className="lead">สร้างเกม, เชิญผู้เล่นเข้าห้องด้วย PIN, และกดผ่าน 5 ด่านที่ตั้งใจให้หงุดหงิดแบบมีเหตุผล</p>

        <div className="stack">
          <Link href="/join" className="button primary">
            เข้าร่วมเกม
          </Link>
          <Link href="/host/login" className="button secondary">
            Host login
          </Link>
        </div>
      </div>
    </main>
  );
}
