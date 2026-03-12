import { defineMiddleware } from 'astro:middleware';
import { buildWheelUrlFromParams } from './core/utils/wheelUrl';

export const onRequest = defineMiddleware((context, next) => {
  const { url, redirect } = context;

  // Check if this is a request to the old single-product URL
  if (url.pathname === '/shop/single-product') {
    // Get query parameters
    const params = url.searchParams;

    // Only redirect if series and finish are present (minimum required for new URL)
    if (params.has('series') && params.has('finish')) {
      // Build new wheel URL from query parameters
      const newUrl = buildWheelUrlFromParams(params);

      // Return 301 permanent redirect
      return redirect(newUrl, 301);
    }
  }

  // Continue to the next middleware or route handler
  return next();
});
