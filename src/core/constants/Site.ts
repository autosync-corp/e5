/**
 * Canonical production origin. Apex e5wheels.com already 308s to www via
 * Vercel domain config; this codebase must never emit the apex host.
 */
export const SITE_URL = 'https://www.e5wheels.com';
