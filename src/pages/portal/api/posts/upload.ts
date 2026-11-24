import type { APIRoute } from 'astro';
import { put } from '@vercel/blob';
import { jsonError, jsonOk, requirePortalSession, requireSameOrigin } from '@/core/portal/api-guard.ts';
import { blobConfigured, MAX_IMAGE_BYTES } from '@/core/portal/slides.ts';
import { isValidSlug, slugifyTitle } from '@/core/portal/posts.ts';

export const prerender = false;

const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function extFromMagic(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff === 'RIFF' && webp === 'WEBP') return 'webp';
  return null;
}

export const POST: APIRoute = async ({ cookies, request }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  if (!blobConfigured()) {
    return jsonError(503, 'Image uploads are not available in this environment.');
  }

  const length = Number(request.headers.get('content-length') || '0');
  if (length > MAX_IMAGE_BYTES + 64 * 1024) {
    return jsonError(413, 'Image is too large (max 4 MB).');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, 'Choose an image file.');
  }

  const file = form.get('file');
  if (!(file instanceof File)) return jsonError(400, 'Choose an image file.');
  if (file.size > MAX_IMAGE_BYTES) return jsonError(413, 'Image is too large (max 4 MB).');
  if (file.size < 32) return jsonError(400, 'Image file is empty.');

  const typeExt = TYPES[file.type];
  const buffer = new Uint8Array(await file.arrayBuffer());
  const magicExt = extFromMagic(buffer);
  if (!magicExt) return jsonError(400, 'Use a JPEG, PNG, or WebP image.');
  if (typeExt && typeExt !== magicExt) return jsonError(400, 'Image type does not match the file contents.');

  const rawSlug = String(form.get('slug') || 'post');
  const slug = isValidSlug(rawSlug) ? rawSlug : slugifyTitle(rawSlug) || 'post';

  try {
    const contentType = magicExt === 'jpg' ? 'image/jpeg' : magicExt === 'png' ? 'image/png' : 'image/webp';
    const blob = await put(`portal/blog/${slug}.${magicExt}`, new Blob([buffer], { type: contentType }), {
      access: 'public',
      addRandomSuffix: true,
      contentType,
    });
    return jsonOk({ url: blob.url });
  } catch {
    return jsonError(502, 'Image upload failed.');
  }
};
