import type { GalleryWheelPick, StoredGallery, StoredGalleryPhoto } from '@/core/portal/galleryTypes.ts';

function clean(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function wheelPhrase(wheel: GalleryWheelPick, fallbackStyle = ''): string {
  const style = clean(wheel.style) || fallbackStyle;
  const finish = clean(wheel.finish);
  const size = clean(wheel.size);
  const parts = [style ? `E5 ${style}` : '', finish, size].filter(Boolean);
  return parts.join(' ');
}

export function generationFromYear(year: string | number): string {
  const n = Number(year);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n >= 2020) return 'C8';
  if (n >= 2014) return 'C7';
  if (n >= 2005) return 'C6';
  if (n >= 1997) return 'C5';
  return '';
}

export function suggestGalleryTitle(input: {
  year?: string;
  generation?: string;
  trim?: string;
  vehicleColor?: string;
  style?: string;
}): string {
  const parts = [clean(input.year), clean(input.generation), clean(input.trim), clean(input.vehicleColor)].filter(Boolean);
  const base = parts.join(' ') || 'Corvette';
  const style = clean(input.style);
  if (style) return `${base} ${style}`.slice(0, 160);
  return base.slice(0, 160);
}

export function suggestGalleryDescription(gallery: Pick<
  StoredGallery,
  'year' | 'generation' | 'trim' | 'body' | 'vehicleColor' | 'front' | 'rear' | 'square'
>): string {
  const vehicle = [clean(gallery.year), 'Chevrolet Corvette', clean(gallery.generation), clean(gallery.trim), clean(gallery.body), clean(gallery.vehicleColor)]
    .filter(Boolean)
    .join(' ');
  const front = wheelPhrase(gallery.front);
  const rear = wheelPhrase(gallery.rear);
  const same = gallery.square || (gallery.front.pn && gallery.front.pn === gallery.rear.pn) || (!gallery.rear.pn && front);
  if (!vehicle && !front) return '';
  if (!front) return vehicle ? `${vehicle}.` : '';
  if (same || !rear || rear === front) {
    return `${vehicle || 'Corvette'} with ${front} wheels.`.replace(/\s+/g, ' ').trim();
  }
  return `${vehicle || 'Corvette'} with ${front} front and ${rear} rear wheels.`.replace(/\s+/g, ' ').trim();
}

export function suggestPhotoAlt(
  gallery: Pick<StoredGallery, 'year' | 'generation' | 'trim' | 'vehicleColor' | 'front'>,
  _photo: Pick<StoredGalleryPhoto, 'id'>,
  index: number,
): string {
  const vehicle = [clean(gallery.year), clean(gallery.generation), clean(gallery.trim), clean(gallery.vehicleColor)].filter(Boolean).join(' ');
  const wheels = wheelPhrase(gallery.front);
  const subject = [vehicle || 'Corvette', wheels ? `with ${wheels} wheels` : ''].filter(Boolean).join(' ');
  return `${subject} — photo ${index + 1}`.replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function youtubeIdFromInput(input: string): string {
  const raw = clean(input);
  if (!raw) return '';
  const match =
    raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ||
    raw.match(/^([a-zA-Z0-9_-]{11})$/);
  return match?.[1] || '';
}
