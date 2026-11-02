import { NextResponse } from 'next/server';
import { signHostSession } from '@/src/lib/auth';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const hostPassword = process.env.HOST_PASSWORD;

  if (!hostPassword) {
    return NextResponse.json({ error: 'HOST_PASSWORD_NOT_CONFIGURED' }, { status: 500 });
  }

  if (body.password !== hostPassword) {
    return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 401 });
  }

  const token = await signHostSession();

  const response = NextResponse.json({ ok: true });
  response.cookies.set('host_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('host_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
