import type { CorvetteGalleryItem, GalleryMediaItem } from '@/pages/gallery/constants/CorvetteGalleryData.ts';

export function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

export function absoluteUrl(url: string, site: string): string {
  if (!url) return '';
  if (isAbsoluteUrl(url)) return url;
  if (url.startsWith('/')) return `${site}${url}`;
  return `${site}/${url}`;
}

function localGalleryPath(galleryId: string | null | undefined, file: string): string {
  if (!file) return '';
  if (isAbsoluteUrl(file) || file.startsWith('/')) return file;
  if (!galleryId) return `/${file}`;
  return `/assets/images/gallery/corvette/${galleryId}/${file}`;
}

export function galleryMediaItems(item: CorvetteGalleryItem): GalleryMediaItem[] {
  const id = item.galleryId;

  if (item.media && item.media.length > 0) {
    return item.media.map((entry) => {
      if (entry.type === 'video') {
        return {
          type: 'video',
          youtubeId: entry.youtubeId,
          thumbnail: entry.thumbnail ? localGalleryPath(id, entry.thumbnail) : undefined,
        };
      }
      return {
        type: 'image',
        url: localGalleryPath(id, entry.url || ''),
      };
    });
  }

  if (item.images && item.images.length > 0) {
    return item.images.map((file) => ({
      type: 'image' as const,
      url: localGalleryPath(id, file),
    }));
  }

  return [];
}

export function galleryCoverUrl(item: CorvetteGalleryItem): string {
  const media = galleryMediaItems(item);
  const firstImage = media.find((entry) => entry.type === 'image' && entry.url);
  if (firstImage?.url) return firstImage.url;
  if (item.galleryId) return `/assets/images/gallery/corvette/${item.galleryId}/0.webp`;
  return '';
}
