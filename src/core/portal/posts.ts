import { portalRedis } from '@/core/portal/slides.ts';
import {
  decodeEntities,
  isAllowedImageSrc,
  renderMarkdown,
  sanitizeHtml,
  stripTags,
} from '@/core/portal/html.ts';

export const POSTS_INDEX_KEY = 'e5:portal:posts:index';
export const POSTS_DOC_VERSION = 1;
export const WP_API = 'https://post.e5wheels.com/wp-json/wp/v2';
export const MAX_BODY_CHARS = 200_000;
export const MAX_MARKDOWN_CHARS = 100_000;
export const MAX_TITLE = 180;
export const MAX_EXCERPT = 320;
export const MAX_AUTHOR = 80;
export const MAX_SLUG = 80;
export const MAX_COVER_ALT = 160;
export const MAX_COVER_URL = 500;
export const DEFAULT_AUTHOR = 'E5 Wheels';

const CACHE_TTL_MS = 60_000;
const WP_TTL_MS = 60_000;

export type BodyMode = 'html' | 'markdown';

export type StoredPost = {
  version: number;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  modified: string;
  coverUrl: string;
  coverAlt: string;
  bodyHtml: string;
  bodyMarkdown: string;
  bodyMode: BodyMode;
  published: boolean;
  deleted: boolean;
};

export type PublicPost = {
  slug: string;
  titleHtml: string;
  titleText: string;
  excerpt: string;
  author: string;
  date: string;
  modified: string;
  coverUrl: string;
  coverAlt: string;
  bodyHtml: string;
  source: 'wordpress' | 'portal';
};

export type PortalPost = PublicPost & {
  bodyMarkdown: string;
  bodyMode: BodyMode;
  published: boolean;
  deleted: boolean;
  slugLocked: boolean;
};

export type PostsIndex = {
  version: number;
  slugs: string[];
};

type WpPost = {
  slug?: unknown;
  date?: unknown;
  modified?: unknown;
  title?: { rendered?: unknown };
  excerpt?: { rendered?: unknown };
  content?: { rendered?: unknown };
  _embedded?: { 'wp:featuredmedia'?: Array<{ source_url?: unknown; alt_text?: unknown }> };
};

type CacheBag = {
  public?: { posts: PublicPost[]; ts: number };
  overlays?: { items: StoredPost[]; ts: number };
  wp?: { posts: PublicPost[]; ts: number };
};

const cache = globalThis as typeof globalThis & { __e5PortalPosts?: CacheBag };

function bag(): CacheBag {
  if (!cache.__e5PortalPosts) cache.__e5PortalPosts = {};
  return cache.__e5PortalPosts;
}

function bustCache() {
  cache.__e5PortalPosts = {};
}

export function postRedisKey(slug: string): string {
  return `e5:portal:posts:${slug}`;
}

export function slugifyTitle(title: string): string {
  return decodeEntities(title)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= MAX_SLUG;
}

function clip(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function isoDate(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function featured(wp: WpPost): { url: string; alt: string } {
  const media = wp._embedded?.['wp:featuredmedia']?.[0];
  const url = typeof media?.source_url === 'string' ? media.source_url : '';
  const alt = typeof media?.alt_text === 'string' ? media.alt_text : '';
  return { url, alt };
}

function mapWp(wp: WpPost): PublicPost | null {
  const slug = typeof wp.slug === 'string' ? wp.slug.trim() : '';
  if (!slug) return null;
  const titleHtml = typeof wp.title?.rendered === 'string' ? wp.title.rendered : '';
  const excerptHtml = typeof wp.excerpt?.rendered === 'string' ? wp.excerpt.rendered : '';
  const bodyHtml = typeof wp.content?.rendered === 'string' ? wp.content.rendered : '';
  const date = typeof wp.date === 'string' ? wp.date : '';
  const modified = typeof wp.modified === 'string' ? wp.modified : date;
  const cover = featured(wp);
  return {
    slug,
    titleHtml,
    titleText: decodeEntities(stripTags(titleHtml)),
    excerpt: stripTags(excerptHtml),
    author: DEFAULT_AUTHOR,
    date,
    modified,
    coverUrl: cover.url,
    coverAlt: cover.alt || decodeEntities(stripTags(titleHtml)),
    bodyHtml,
    source: 'wordpress',
  };
}

async function fetchWpPosts(): Promise<PublicPost[]> {
  const now = Date.now();
  const hit = bag().wp;
  if (hit && now - hit.ts < WP_TTL_MS) return hit.posts;
  try {
    const res = await fetch(`${WP_API}/posts?_embed&per_page=100&orderby=date&order=desc`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`wp ${res.status}`);
    const raw = (await res.json()) as unknown;
    const posts = Array.isArray(raw) ? raw.map(mapWp).filter((p): p is PublicPost => Boolean(p)) : [];
    bag().wp = { posts, ts: now };
    return posts;
  } catch (error) {
    console.error('Failed to fetch blog posts from WordPress:', error);
    return hit?.posts || [];
  }
}

async function fetchWpPost(slug: string): Promise<PublicPost | null> {
  const cached = (bag().wp?.posts || []).find((p) => p.slug === slug);
  if (cached) return cached;
  try {
    const res = await fetch(`${WP_API}/posts?slug=${encodeURIComponent(slug)}&_embed`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw) || !raw[0]) return null;
    return mapWp(raw[0] as WpPost);
  } catch (error) {
    console.error('Failed to fetch blog post from WordPress:', error);
    return null;
  }
}

function parseStored(raw: unknown): StoredPost | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
  if (!isValidSlug(slug)) return null;
  const title = typeof row.title === 'string' ? row.title : '';
  const excerpt = typeof row.excerpt === 'string' ? row.excerpt : '';
  const author = typeof row.author === 'string' ? row.author : DEFAULT_AUTHOR;
  const date = typeof row.date === 'string' ? row.date : '';
  const modified = typeof row.modified === 'string' ? row.modified : date;
  const coverUrl = typeof row.coverUrl === 'string' ? row.coverUrl : '';
  const coverAlt = typeof row.coverAlt === 'string' ? row.coverAlt : '';
  const bodyHtml = typeof row.bodyHtml === 'string' ? row.bodyHtml : '';
  const bodyMarkdown = typeof row.bodyMarkdown === 'string' ? row.bodyMarkdown : '';
  const bodyMode: BodyMode = row.bodyMode === 'markdown' ? 'markdown' : 'html';
  return {
    version: POSTS_DOC_VERSION,
    slug,
    title,
    excerpt,
    author,
    date,
    modified,
    coverUrl,
    coverAlt,
    bodyHtml,
    bodyMarkdown,
    bodyMode,
    published: row.published !== false,
    deleted: row.deleted === true,
  };
}

function storedToPublic(post: StoredPost): PublicPost {
  const titleText = decodeEntities(stripTags(post.title)) || post.title;
  const bodyHtml =
    post.bodyMode === 'markdown' ? sanitizeHtml(post.bodyHtml, 'strict') : sanitizeHtml(post.bodyHtml, 'preserve');
  return {
    slug: post.slug,
    titleHtml: escapeForHtml(titleText),
    titleText,
    excerpt: post.excerpt,
    author: post.author || DEFAULT_AUTHOR,
    date: post.date,
    modified: post.modified,
    coverUrl: post.coverUrl,
    coverAlt: post.coverAlt,
    bodyHtml,
    source: 'portal',
  };
}

function escapeForHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadOverlays(): Promise<StoredPost[]> {
  const now = Date.now();
  const hit = bag().overlays;
  if (hit && now - hit.ts < CACHE_TTL_MS) return hit.items;
  const redis = portalRedis();
  if (!redis) return hit?.items || [];
  try {
    const indexRaw = await redis.get<PostsIndex | string>(POSTS_INDEX_KEY);
    const index = typeof indexRaw === 'string' ? (JSON.parse(indexRaw) as PostsIndex) : indexRaw;
    const slugs = Array.isArray(index?.slugs) ? index.slugs.filter((s) => typeof s === 'string') : [];
    if (!slugs.length) {
      bag().overlays = { items: [], ts: now };
      return [];
    }
    const keys = slugs.map(postRedisKey);
    const rows = (await redis.mget(...keys)) as unknown[];
    const items: StoredPost[] = [];
    for (const row of rows || []) {
      const parsed = parseStored(typeof row === 'string' ? JSON.parse(row) : row);
      if (parsed) items.push(parsed);
    }
    bag().overlays = { items, ts: now };
    return items;
  } catch (error) {
    console.error('Failed to load portal blog posts:', error);
    return hit?.items || [];
  }
}

async function loadOverlay(slug: string): Promise<StoredPost | null> {
  const cached = (await loadOverlays()).find((p) => p.slug === slug);
  if (cached) return cached;
  const redis = portalRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<StoredPost | string>(postRedisKey(slug));
    return parseStored(typeof raw === 'string' ? JSON.parse(raw) : raw);
  } catch {
    return null;
  }
}

function sortByDate(posts: PublicPost[]): PublicPost[] {
  return [...posts].sort((a, b) => {
    const da = new Date(a.date).getTime() || 0;
    const db = new Date(b.date).getTime() || 0;
    return db - da;
  });
}

export async function loadPublicPosts(): Promise<PublicPost[]> {
  const now = Date.now();
  const hit = bag().public;
  if (hit && now - hit.ts < CACHE_TTL_MS) return hit.posts;
  const [wp, overlays] = await Promise.all([fetchWpPosts(), loadOverlays()]);
  const overlayBySlug = new Map(overlays.map((p) => [p.slug, p]));
  const merged: PublicPost[] = [];
  const seen = new Set<string>();
  for (const post of wp) {
    const overlay = overlayBySlug.get(post.slug);
    seen.add(post.slug);
    if (overlay?.deleted || overlay?.published === false) continue;
    merged.push(overlay ? storedToPublic(overlay) : post);
  }
  for (const overlay of overlays) {
    if (seen.has(overlay.slug)) continue;
    if (overlay.deleted || !overlay.published) continue;
    merged.push(storedToPublic(overlay));
  }
  const posts = sortByDate(merged);
  bag().public = { posts, ts: now };
  return posts;
}

export type LoadPostResult =
  | { status: 'ok'; post: PublicPost }
  | { status: 'unpublished' }
  | { status: 'gone' }
  | { status: 'missing' };

export async function loadPublicPost(slug: string): Promise<LoadPostResult> {
  if (!slug) return { status: 'missing' };
  const overlay = await loadOverlay(slug);
  if (overlay?.deleted) return { status: 'gone' };
  if (overlay && overlay.published === false) return { status: 'unpublished' };
  if (overlay && overlay.published) return { status: 'ok', post: storedToPublic(overlay) };
  const wp = await fetchWpPost(slug);
  if (wp) return { status: 'ok', post: wp };
  return { status: 'missing' };
}

function toPortalPost(post: PublicPost, extra?: Partial<PortalPost>): PortalPost {
  return {
    ...post,
    bodyMarkdown: extra?.bodyMarkdown || '',
    bodyMode: extra?.bodyMode || (post.source === 'wordpress' ? 'html' : 'markdown'),
    published: extra?.published ?? true,
    deleted: extra?.deleted ?? false,
    slugLocked: extra?.slugLocked ?? post.source === 'wordpress',
  };
}

export async function loadPortalPosts(): Promise<PortalPost[]> {
  const [wp, overlays] = await Promise.all([fetchWpPosts(), loadOverlays()]);
  const overlayBySlug = new Map(overlays.map((p) => [p.slug, p]));
  const merged: PortalPost[] = [];
  const seen = new Set<string>();
  for (const post of wp) {
    const overlay = overlayBySlug.get(post.slug);
    seen.add(post.slug);
    if (overlay?.deleted) continue;
    if (overlay) {
      merged.push(
        toPortalPost(storedToPublic(overlay), {
          bodyMarkdown: overlay.bodyMarkdown,
          bodyMode: overlay.bodyMode,
          published: overlay.published,
          deleted: false,
          slugLocked: true,
        }),
      );
    } else {
      merged.push(toPortalPost(post, { slugLocked: true, published: true, bodyMode: 'html' }));
    }
  }
  for (const overlay of overlays) {
    if (seen.has(overlay.slug) || overlay.deleted) continue;
    merged.push(
      toPortalPost(storedToPublic(overlay), {
        bodyMarkdown: overlay.bodyMarkdown,
        bodyMode: overlay.bodyMode,
        published: overlay.published,
        slugLocked: false,
      }),
    );
  }
  return merged.sort((a, b) => {
    const da = new Date(a.date).getTime() || 0;
    const db = new Date(b.date).getTime() || 0;
    return db - da;
  });
}

export async function loadPortalPost(slug: string): Promise<PortalPost | null> {
  if (slug === 'new') {
    return toPortalPost(
      {
        slug: '',
        titleHtml: '',
        titleText: '',
        excerpt: '',
        author: DEFAULT_AUTHOR,
        date: new Date().toISOString(),
        modified: new Date().toISOString(),
        coverUrl: '',
        coverAlt: '',
        bodyHtml: '',
        source: 'portal',
      },
      { published: false, bodyMode: 'markdown', slugLocked: false },
    );
  }
  const overlay = await loadOverlay(slug);
  if (overlay && !overlay.deleted) {
    const wp = await fetchWpPost(slug);
    return toPortalPost(storedToPublic(overlay), {
      bodyMarkdown: overlay.bodyMarkdown,
      bodyMode: overlay.bodyMode,
      published: overlay.published,
      slugLocked: Boolean(wp),
    });
  }
  const wp = await fetchWpPost(slug);
  if (wp) return toPortalPost(wp, { slugLocked: true, published: true, bodyMode: 'html' });
  return null;
}

export type SavePostInput = {
  slug?: unknown;
  previousSlug?: unknown;
  title?: unknown;
  excerpt?: unknown;
  author?: unknown;
  date?: unknown;
  coverUrl?: unknown;
  coverAlt?: unknown;
  bodyMarkdown?: unknown;
  replaceBody?: unknown;
  published?: unknown;
};

export async function savePortalPost(input: SavePostInput): Promise<{ post?: PortalPost; error?: string }> {
  const title = clip(typeof input.title === 'string' ? input.title : '', MAX_TITLE);
  if (!title) return { error: 'Add a title.' };

  const requestedSlug = clip(typeof input.slug === 'string' ? input.slug : slugifyTitle(title), MAX_SLUG);
  if (!isValidSlug(requestedSlug)) {
    return { error: 'Use a simple web address: lowercase letters, numbers, and hyphens.' };
  }

  const previousSlug =
    typeof input.previousSlug === 'string' && isValidSlug(input.previousSlug) ? input.previousSlug : requestedSlug;
  const excerpt = clip(typeof input.excerpt === 'string' ? input.excerpt : '', MAX_EXCERPT);
  const author = clip(typeof input.author === 'string' ? input.author : DEFAULT_AUTHOR, MAX_AUTHOR) || DEFAULT_AUTHOR;
  const date = isoDate(typeof input.date === 'string' ? input.date : '') || new Date().toISOString();
  const coverUrl = clip(typeof input.coverUrl === 'string' ? input.coverUrl : '', MAX_COVER_URL);
  const coverAlt = clip(typeof input.coverAlt === 'string' ? input.coverAlt : '', MAX_COVER_ALT);
  const published = input.published !== false;
  const replaceBody = input.replaceBody === true;
  const markdown = typeof input.bodyMarkdown === 'string' ? input.bodyMarkdown.slice(0, MAX_MARKDOWN_CHARS) : '';

  if (/javascript:/i.test(markdown) || /<script/i.test(markdown)) {
    return { error: 'Remove scripts and javascript links from the post.' };
  }
  if (coverUrl && !isAllowedImageSrc(coverUrl)) {
    return { error: 'That cover image address is not allowed.' };
  }

  const redis = portalRedis();
  if (!redis) return { error: 'Saving posts is not available in this environment.' };

  const [existing, wp, overlays] = await Promise.all([
    loadOverlay(previousSlug),
    fetchWpPost(previousSlug),
    loadOverlays(),
  ]);
  const wpOnNew = requestedSlug !== previousSlug ? await fetchWpPost(requestedSlug) : wp;
  const slugLocked = Boolean(wp) || Boolean(existing && (await fetchWpPost(existing.slug)));
  const slug = slugLocked ? previousSlug : requestedSlug;
  if (slugLocked && requestedSlug !== previousSlug) {
    return { error: 'This post already has a live address. Leave the web address as it is so existing links keep working.' };
  }

  const taken = overlays.find((p) => p.slug === slug && !p.deleted && p.slug !== previousSlug);
  if (taken || (wpOnNew && slug !== previousSlug && !slugLocked)) {
    return { error: 'That web address is already used by another post.' };
  }

  let bodyMode: BodyMode = existing?.bodyMode || (wp && !replaceBody ? 'html' : 'markdown');
  let bodyHtml = existing?.bodyHtml || wp?.bodyHtml || '';
  let bodyMarkdown = existing?.bodyMarkdown || '';

  if (replaceBody || !wp || existing?.bodyMode === 'markdown' || !bodyHtml) {
    if (!markdown.trim() && !bodyHtml.trim()) return { error: 'Add some post text.' };
    if (markdown.trim()) {
      const rendered = renderMarkdown(markdown);
      if (!rendered.trim()) return { error: 'Add some post text.' };
      bodyHtml = rendered;
      bodyMarkdown = markdown;
      bodyMode = 'markdown';
    }
  } else if (wp && !replaceBody) {
    bodyMode = 'html';
    bodyHtml = existing?.bodyMode === 'html' && existing.bodyHtml ? existing.bodyHtml : wp.bodyHtml;
    bodyMarkdown = '';
  }

  if (bodyMode === 'markdown') {
    bodyHtml = sanitizeHtml(bodyHtml, 'strict');
  } else {
    bodyHtml = sanitizeHtml(bodyHtml, 'preserve');
  }
  if (bodyHtml.length > MAX_BODY_CHARS) return { error: 'This post is too long.' };

  const stored: StoredPost = {
    version: POSTS_DOC_VERSION,
    slug,
    title,
    excerpt,
    author,
    date,
    modified: new Date().toISOString(),
    coverUrl,
    coverAlt: coverAlt || title,
    bodyHtml,
    bodyMarkdown,
    bodyMode,
    published,
    deleted: false,
  };

  try {
    const slugs = new Set(overlays.map((p) => p.slug).filter((s) => s !== previousSlug || s === slug));
    slugs.add(slug);
    if (previousSlug !== slug) slugs.delete(previousSlug);
    const index: PostsIndex = { version: POSTS_DOC_VERSION, slugs: [...slugs] };
    const pipeline = redis.pipeline();
    pipeline.set(postRedisKey(slug), stored);
    pipeline.set(POSTS_INDEX_KEY, index);
    if (previousSlug !== slug) {
      const old = existing ? { ...existing, deleted: true, published: false, modified: stored.modified } : null;
      if (old) {
        pipeline.set(postRedisKey(previousSlug), old);
        index.slugs = [...new Set([...index.slugs, previousSlug])];
        pipeline.set(POSTS_INDEX_KEY, index);
      } else {
        pipeline.del(postRedisKey(previousSlug));
      }
    }
    await pipeline.exec();
    bustCache();
    const wpStill = await fetchWpPost(slug);
    return {
      post: toPortalPost(storedToPublic(stored), {
        bodyMarkdown: stored.bodyMarkdown,
        bodyMode: stored.bodyMode,
        published: stored.published,
        slugLocked: Boolean(wpStill),
      }),
    };
  } catch {
    return { error: 'Could not save this post. Try again.' };
  }
}

export async function deletePortalPost(slug: string): Promise<{ error?: string }> {
  if (!isValidSlug(slug)) return { error: 'That post was not found.' };
  const redis = portalRedis();
  if (!redis) return { error: 'Saving posts is not available in this environment.' };
  const [existing, wp, overlays] = await Promise.all([loadOverlay(slug), fetchWpPost(slug), loadOverlays()]);
  const base: StoredPost = existing || {
    version: POSTS_DOC_VERSION,
    slug,
    title: wp?.titleText || slug,
    excerpt: wp?.excerpt || '',
    author: wp?.author || DEFAULT_AUTHOR,
    date: wp?.date || new Date().toISOString(),
    modified: new Date().toISOString(),
    coverUrl: wp?.coverUrl || '',
    coverAlt: wp?.coverAlt || '',
    bodyHtml: wp?.bodyHtml || '',
    bodyMarkdown: '',
    bodyMode: 'html',
    published: false,
    deleted: true,
  };
  const stored: StoredPost = { ...base, published: false, deleted: true, modified: new Date().toISOString() };
  try {
    const slugs = new Set(overlays.map((p) => p.slug));
    slugs.add(slug);
    await redis
      .pipeline()
      .set(postRedisKey(slug), stored)
      .set(POSTS_INDEX_KEY, { version: POSTS_DOC_VERSION, slugs: [...slugs] } satisfies PostsIndex)
      .exec();
    bustCache();
    return {};
  } catch {
    return { error: 'Could not remove this post. Try again.' };
  }
}

export function redisConfigured(): boolean {
  return Boolean(portalRedis());
}

export { isAllowedImageSrc, portalRedis };
