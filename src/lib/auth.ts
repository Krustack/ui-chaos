import { SignJWT, jwtVerify } from 'jose';

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured. Set it in your environment before starting the app.');
  }

  return new TextEncoder().encode(secret);
}

export type HostSessionClaims = {
  sub: 'host';
  role: 'host';
};

export async function signHostSession() {
  return new SignJWT({ sub: 'host', role: 'host' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getAuthSecret());
}

export async function verifyHostSession(token: string) {
  try {
    const result = await jwtVerify(token, getAuthSecret());
    return result.payload as HostSessionClaims;
  } catch {
    return null;
  }
}
