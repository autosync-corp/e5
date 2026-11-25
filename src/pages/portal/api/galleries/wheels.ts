import type { APIRoute } from 'astro';
import { jsonOk, requirePortalSession } from '@/core/portal/api-guard.ts';
import { wheelCatalogOptions, wheelStylesFromCatalog } from '@/core/portal/wheelPicker.ts';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  return jsonOk({
    styles: wheelStylesFromCatalog(),
    wheels: wheelCatalogOptions,
  });
};
