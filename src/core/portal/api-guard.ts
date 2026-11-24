import type { AstroCookies } from 'astro';
import { readSession, type PortalUser } from './auth.ts';
import { requestHost } from './host.ts';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'private, no-store',
};

export function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), { status, headers: JSON_HEADERS });
}

export function jsonOk(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

export function requirePortalSession(cookies: AstroCookies): PortalUser | Response {
  const user = readSession(cookies);
  if (!user) return jsonError(401, 'Unauthorized');
  return user;
}

export function requireSameOrigin(request: Request): Response | null {
  const origin = request.headers.get('origin');
  if (!origin) return jsonError(403, 'Missing Origin');
  let originHost = '';
  try {
    originHost = new URL(origin).host.split(':')[0].toLowerCase();
  } catch {
    return jsonError(403, 'Invalid Origin');
  }
  const host = requestHost(request);
  if (originHost !== host) return jsonError(403, 'Invalid Origin');
  return null;
}
