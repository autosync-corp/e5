import type { APIRoute } from 'astro';
import { clearSessionCookie } from '@/core/portal/auth.ts';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  clearSessionCookie(cookies);
  cookies.delete('admin_auth', { path: '/' });
  cookies.delete('admin_token', { path: '/' });
  return redirect('/admin');
};
