import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { Redis } from '@upstash/redis';
import type { AstroCookies } from 'astro';

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  opts: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, opts, (err, derived) => {
      if (err) reject(err);
      else resolve(derived as Buffer);
    });
  });
}

export const PORTAL_COOKIE = 'e5_portal';
export const SESSION_MAX_AGE_SEC = 60 * 60 * 8;
const LOGIN_WINDOW_SEC = 15 * 60;
const LOGIN_MAX_ATTEMPTS = 8;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;

export type PortalUser = {
  id: string;
  username: string;
  role: 'client';
};

/** Single shared client user for Section 1. Later sections can load more from KV. */
export const PORTAL_USERS: PortalUser[] = [{ id: 'e5', username: 'e5', role: 'client' }];

type SessionPayload = {
  u: string;
  exp: number;
};

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  return fromMeta || '';
}

function sessionSecret(): string {
  return env('PORTAL_SESSION_SECRET') || env('ADMIN_PASSWORD');
}

function getRedis(): Redis | null {
  try {
    const url = env('KV_REST_API_URL');
    const token = env('KV_REST_API_TOKEN');
    if (url && token) {
      return new Redis({ url, token });
    }
  } catch {
    /* Redis unavailable */
  }
  return null;
}

const memHits = globalThis as typeof globalThis & {
  __e5PortalLogin?: Map<string, { n: number; exp: number }>;
};

function memStore() {
  if (!memHits.__e5PortalLogin) memHits.__e5PortalLogin = new Map();
  return memHits.__e5PortalLogin;
}

function memLocked(key: string): boolean {
  const rec = memStore().get(key);
  if (!rec) return false;
  if (Date.now() > rec.exp) {
    memStore().delete(key);
    return false;
  }
  return rec.n >= LOGIN_MAX_ATTEMPTS;
}

function memFail(key: string) {
  const now = Date.now();
  const rec = memStore().get(key);
  if (!rec || now > rec.exp) {
    memStore().set(key, { n: 1, exp: now + LOGIN_WINDOW_SEC * 1000 });
    return;
  }
  rec.n += 1;
}

export async function isLoginLocked(ip: string): Promise<boolean> {
  const key = `e5:portal:login:${ip}`;
  try {
    const redis = getRedis();
    if (redis) {
      const n = await redis.get<number>(key);
      return (n || 0) >= LOGIN_MAX_ATTEMPTS;
    }
  } catch {
    /* fall through to memory */
  }
  return memLocked(key);
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const key = `e5:portal:login:${ip}`;
  try {
    const redis = getRedis();
    if (redis) {
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, LOGIN_WINDOW_SEC);
      return;
    }
  } catch {
    /* fall through to memory */
  }
  memFail(key);
}

export async function clearLoginFailures(ip: string): Promise<void> {
  const key = `e5:portal:login:${ip}`;
  try {
    const redis = getRedis();
    if (redis) {
      await redis.del(key);
      return;
    }
  } catch {
    /* fall through to memory */
  }
  memStore().delete(key);
}

function safeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, Buffer.alloc(ab.length));
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export async function hashPortalPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

async function verifyScrypt(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], 'base64url');
  const expected = Buffer.from(parts[5], 'base64url');
  const derived = await scryptAsync(password, salt, expected.length, { N: n, r, p });
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function verifyPortalPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const hash = env('PORTAL_PASSWORD_HASH');
  if (hash) return verifyScrypt(password, hash);
  const legacy = env('ADMIN_PASSWORD');
  if (legacy) return safeEqualString(password, legacy);
  return false;
}

function sign(body: string): string {
  return createHmac('sha256', sessionSecret()).update(body).digest('base64url');
}

export function createSessionCookieValue(user: PortalUser): string | null {
  if (!sessionSecret()) return null;
  const payload: SessionPayload = {
    u: user.id,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function readSession(cookies: AstroCookies): PortalUser | null {
  if (!sessionSecret()) return null;
  const raw = cookies.get(PORTAL_COOKIE)?.value;
  if (!raw || !raw.includes('.')) return null;
  const [body, sig] = raw.split('.');
  if (!body || !sig || !safeEqualString(sig, sign(body))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    if (!payload?.u || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return PORTAL_USERS.find((u) => u.id === payload.u) || null;
  } catch {
    return null;
  }
}

export function setSessionCookie(cookies: AstroCookies, value: string, secure: boolean) {
  cookies.set(PORTAL_COOKIE, value, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/admin',
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete(PORTAL_COOKIE, { path: '/admin' });
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'local';
}
