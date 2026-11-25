import proposals from '@/data/gallery-factory-color-proposals.json';

type Proposal = {
  slug: string;
  proposedColor?: string;
  confidence?: string;
};

const bySlug = new Map(
  (proposals.items as Proposal[]).map((row) => [row.slug, row]),
);

/** Reviewed Immersive Gallery factory paint. Empty when confidence is low or the field is blank. */
export function proposedFactoryPaint(slug: string): string {
  const row = bySlug.get(slug);
  if (!row) return '';
  if (row.confidence === 'low') return '';
  return (row.proposedColor || '').trim();
}
