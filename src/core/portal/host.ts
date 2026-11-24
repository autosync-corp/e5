export const PORTAL_HOST = 'portal.e5wheels.com';
export const WWW_HOST = 'www.e5wheels.com';
export const SITE_ORIGIN = 'https://www.e5wheels.com';
export const PORTAL_ORIGIN = 'https://portal.e5wheels.com';

export const PORTAL_PAGE_PATHS = [
  '/',
  '/login',
  '/logout',
  '/slides',
  '/links',
  '/blog',
  '/galleries',
  '/performance',
  '/sales',
] as const;

export function requestHost(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const header = request.headers.get('host');
  const raw = forwarded || header || new URL(request.url).host;
  return raw.split(':')[0].toLowerCase();
}

export function isPortalHost(request: Request): boolean {
  return requestHost(request) === PORTAL_HOST;
}

export function isProductionSiteHost(request: Request): boolean {
  const host = requestHost(request);
  return host === WWW_HOST || host === 'e5wheels.com';
}

/** Public href for a portal path (`/`, `/logout`, `/slides`). */
export function portalHref(request: Request, path: string): string {
  const normalized = path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`;
  if (isPortalHost(request)) return normalized;
  return normalized === '/' ? '/portal' : `/portal${normalized}`;
}

export function isPortalPagePath(pathname: string): boolean {
  return (PORTAL_PAGE_PATHS as readonly string[]).includes(pathname);
}

export function internalPortalPath(pathname: string): string {
  if (pathname === '/' || pathname === '/login') return '/portal';
  return `/portal${pathname}`;
}

export function isStaticAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith('/assets') ||
    pathname.startsWith('/_astro') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/@') ||
    pathname.startsWith('/node_modules') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/@fs') ||
    pathname.startsWith('/@id') ||
    pathname.startsWith('/@vite')
  );
}
