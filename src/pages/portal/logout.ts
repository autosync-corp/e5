import type { APIRoute } from 'astro';
import { clearSessionCookie } from '@/core/portal/auth.ts';
import { portalHref } from '@/core/portal/host.ts';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect, request }) => {
  clearSessionCookie(cookies, request);
  return redirect(portalHref(request, '/login'));
};
