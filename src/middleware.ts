import { defineMiddleware } from 'astro:middleware';
import { buildWheelUrlFromParams } from './core/utils/wheelUrl';
import {
  PORTAL_ORIGIN,
  SITE_ORIGIN,
  internalPortalPath,
  isPortalHost,
  isPortalPagePath,
  isProductionSiteHost,
  isStaticAssetPath,
} from './core/portal/host.ts';

const GONE = new Set([
  '/wp-admin',
  '/wp-login.php',
  '/xmlrpc.php',
]);

const PATH_REDIRECTS: Record<string, string> = {
  '/pending': '/',
  '/registration': '/wheel-registration',
  '/visualize-test': '/visualizer',
  '/community': '/events/upcoming',
  '/racing': '/events/upcoming',
  '/search': '/shop',
  '/feed': '/blog',
  '/feed/rss': '/blog',
  '/comments/feed': '/blog',
  '/author': '/about-us',
  '/tag': '/blog',
};

const SHOP_SERIES_TO_WHEELS: Record<string, string> = {
  daytona: '/wheels/daytona',
  sebring: '/wheels/sebring',
  'sebring-2p': '/wheels/sebring-2p',
  speedway: '/wheels/speedway',
  talladega: '/wheels/talladega',
  sonoma: '/wheels/sonoma',
  laguna: '/wheels/laguna',
  'form-forged': '/wheels/form-forged',
  gt01: '/wheels/gt-01',
  'gt-01': '/wheels/gt-01',
  gt02: '/wheels/gt-02',
  'gt-02': '/wheels/gt-02',
  gt03: '/wheels/gt-03',
  'gt-03': '/wheels/gt-03',
  gt04: '/wheels/gt-04',
  'gt-04': '/wheels/gt-04',
};

const FINISH_ALIASES: Record<string, Record<string, string>> = {
  'sebring-2p': {
    black: 'gloss-black',
    'gloss-black-gloss-black-lip': 'gloss-black',
    'gray-polished-lip': 'gray-black-lip',
    'dark-bronze': 'bronze-black-lip',
    'dark-bronze-gloss-black-lip': 'bronze-black-lip',
    'titanium-brushed': 'titanium-black-lip',
    'titanium-brushed-gloss-black-lip': 'titanium-black-lip',
  },
};

const GT_SERIES_ALIAS: Record<string, string> = {
  'gt-01': 'gt01',
  'gt.01': 'gt01',
  'gt_01': 'gt01',
  'gt-02': 'gt02',
  'gt.02': 'gt02',
  'gt_02': 'gt02',
  'gt-03': 'gt03',
  'gt.03': 'gt03',
  'gt_03': 'gt03',
  'gt-04': 'gt04',
  'gt.04': 'gt04',
  'gt_04': 'gt04',
};

function gone() {
  return new Response('Gone', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function noindex(response: Response) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

function portalRobots() {
  return new Response('User-agent: *\nDisallow: /\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect, rewrite, request, locals } = context;
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const flags = locals as Record<string, unknown>;

  if (isPortalHost(request) || flags.portalRewrite) {
    if (pathname === '/robots.txt') return portalRobots();

    if (isStaticAssetPath(pathname) || flags.portalRewrite) {
      return noindex(await next());
    }

    if (pathname === '/portal' || pathname.startsWith('/portal/')) {
      return noindex(await next());
    }

    if (isPortalPagePath(pathname)) {
      flags.portalRewrite = true;
      return noindex(await rewrite(internalPortalPath(pathname)));
    }

    return redirect(`${SITE_ORIGIN}${url.pathname}${url.search}`, 302);
  }

  if (isProductionSiteHost(request) && (pathname === '/portal' || pathname.startsWith('/portal/'))) {
    const rest = pathname === '/portal' ? '/' : pathname.slice('/portal'.length) || '/';
    return redirect(`${PORTAL_ORIGIN}${rest}${url.search}`, 301);
  }

  if (pathname === '/portal/login') {
    flags.portalRewrite = true;
    return noindex(await rewrite('/portal'));
  }

  if (GONE.has(pathname) || pathname.startsWith('/wp-admin/')) {
    return gone();
  }

  if (pathname.startsWith('/page/')) {
    return redirect('/blog', 301);
  }

  const staticTarget = PATH_REDIRECTS[pathname];
  if (staticTarget) {
    return redirect(staticTarget, 301);
  }

  if (pathname === '/' && url.searchParams.has('s')) {
    return redirect('/shop', 301);
  }

  if (pathname === '/shop/single-product') {
    const params = url.searchParams;
    if (params.has('series') && params.has('finish')) {
      return redirect(buildWheelUrlFromParams(params), 301);
    }
    return redirect('/shop', 301);
  }

  const shopParts = pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (shopParts[0] === 'shop' && shopParts[1]) {
    const seriesIn = shopParts[1].toLowerCase();
    const series = GT_SERIES_ALIAS[seriesIn] || seriesIn;
    const finishIn = shopParts[2]?.toLowerCase();
    const finish = (finishIn && FINISH_ALIASES[series]?.[finishIn]) || finishIn;

    if (shopParts.length === 2) {
      const wheels = SHOP_SERIES_TO_WHEELS[seriesIn] || SHOP_SERIES_TO_WHEELS[series];
      return redirect(wheels || '/shop', 301);
    }

    if (series !== seriesIn || (finishIn && finish !== finishIn)) {
      const rest = shopParts.slice(3);
      const nextPath = ['/shop', series, finish, ...rest].filter(Boolean).join('/');
      return redirect(nextPath, 301);
    }
  }

  const response = await next();
  if (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/portal' ||
    pathname.startsWith('/portal/')
  ) {
    noindex(response);
  }
  return response;
});
