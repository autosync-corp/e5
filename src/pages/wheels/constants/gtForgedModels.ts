import { buildWheelUrl } from '@/core/utils/wheelUrl';
import { WHEEL_GALLERY_STUDIO_BANNER } from '@/pages/wheels/constants/Wheels.ts';
import { VETTE_GALLERY_IMAGE_1 } from '@/pages/gallery/constants/Images.ts';
import type { ForgedFinish, ForgedModel } from '@/pages/wheels/constants/e5ForgedModels.ts';
import {
  GT01_BRAND_NAME,
  GT01_BRUSHED_ALUMINUM,
  GT01_GLOSS_BLACK,
  GT01_SATIN_BLACK,
  GT02_BRAND_NAME,
  GT02_BRUSHED_ALUMINUM,
  GT02_GLOSS_BLACK,
  GT02_SATIN_BLACK,
  GT03_BRAND_NAME,
  GT03_BRUSHED_ALUMINUM,
  GT03_GLOSS_BLACK,
  GT03_SATIN_BLACK,
  GT04_BRAND_NAME,
  GT04_BRUSHED_ALUMINUM,
  GT04_GLOSS_BLACK,
  GT04_SATIN_BLACK,
} from '@/pages/wheels/constants/Wheels.ts';

/**
 * Catalog sizes shared by GT.01–GT.04 (official CSV PNs).
 * 19x10 +30 and 20x12 +50 use the 5x120.65 PN suffix; the rest use 5x120.
 */
export const GT_CATALOG_SIZE_LINES = [
  '19 x 9 / +35mm',
  '19 x 10 / +30mm',
  '20 x 10 / +25mm',
  '20 x 11 / +45mm',
  '20 x 12 / +50mm',
  '21 x 13 / +20mm',
];

export const GT_CATALOG_BOLT_PATTERN = '5x120.65 / 5x120';

/** Complete-set dollars from official CSV unit × 4. */
const GT_FINISH_SET_PRICES: Record<string, string> = {
  'Brushed Aluminum': '$5,100.00 - $6,700.00',
  'Gloss Black': '$4,900.00 - $6,500.00',
  'Satin Black': '$4,900.00 - $6,500.00',
};

function gtFinishes(brandName: string, images: { brushed: string; gloss: string; satin: string }): ForgedFinish[] {
  return [
    {
      name: 'Brushed Aluminum',
      image: images.brushed,
      href: buildWheelUrl(brandName, 'Brushed Aluminum'),
      call: false,
      priceLabel: GT_FINISH_SET_PRICES['Brushed Aluminum'],
    },
    {
      name: 'Gloss Black',
      image: images.gloss,
      href: buildWheelUrl(brandName, 'Gloss Black'),
      call: false,
      priceLabel: GT_FINISH_SET_PRICES['Gloss Black'],
    },
    {
      name: 'Satin Black',
      image: images.satin,
      href: buildWheelUrl(brandName, 'Satin Black'),
      call: false,
      priceLabel: GT_FINISH_SET_PRICES['Satin Black'],
    },
  ];
}

function gtModel(opts: {
  brandName: string;
  slug: string;
  brushed: string;
  gloss: string;
  satin: string;
}): ForgedModel {
  const { brandName, slug, brushed, gloss, satin } = opts;
  return {
    brandName,
    displayName: brandName,
    h1: `${brandName} CORVETTE WHEELS`,
    exclusive: 'MADE TO ORDER · 6 WEEK LEAD TIME',
    title: `${brandName} Corvette Wheels | E5 Wheels`,
    description: `${brandName} Corvette wheels in Brushed Aluminum, Gloss Black, and Satin Black. Catalog sizes 19x9 +35mm through 21x13 +20mm. Complete sets from $4,900.`,
    canonicalPath: `/wheels/${slug}`,
    ogImage: brushed,
    heroImage: brushed,
    heroAlt: `${brandName} wheel in Brushed Aluminum`,
    heroNameClass: 'text-black drop-shadow-[0_1px_8px_rgba(255,255,255,0.45)]',
    heroFit: 'contain',
    wheelImage: brushed,
    wheelAlt: `${brandName} wheel in Brushed Aluminum`,
    frontSize: '20 x 10 / +25mm',
    rearSize: '21 x 13 / +20mm',
    sizeLines: GT_CATALOG_SIZE_LINES,
    boltPattern: GT_CATALOG_BOLT_PATTERN,
    shopFitmentHref: buildWheelUrl(brandName, 'Brushed Aluminum'),
    shopFitmentLabel: 'SHOP FITMENT',
    showProcessSections: false,
    exploreHref: null,
    finishes: gtFinishes(brandName, { brushed, gloss, satin }),
    finishingBg: brushed,
    spinImage: brushed,
    spinAlt: `${brandName} wheel`,
    spinFit: 'contain',
    vetteGalleryImage: VETTE_GALLERY_IMAGE_1,
    vetteGalleryAlt: 'Corvette builds fitted with E5 wheels',
    wheelGalleryImage: WHEEL_GALLERY_STUDIO_BANNER,
    productSchemaName: `E5 ${brandName} Corvette Wheel`,
    schemaOffers: { lowPrice: '4900', highPrice: '6700' },
  };
}

export const GT_01_MODEL = gtModel({
  brandName: GT01_BRAND_NAME,
  slug: 'gt-01',
  brushed: GT01_BRUSHED_ALUMINUM,
  gloss: GT01_GLOSS_BLACK,
  satin: GT01_SATIN_BLACK,
});

export const GT_02_MODEL = gtModel({
  brandName: GT02_BRAND_NAME,
  slug: 'gt-02',
  brushed: GT02_BRUSHED_ALUMINUM,
  gloss: GT02_GLOSS_BLACK,
  satin: GT02_SATIN_BLACK,
});

export const GT_03_MODEL = gtModel({
  brandName: GT03_BRAND_NAME,
  slug: 'gt-03',
  brushed: GT03_BRUSHED_ALUMINUM,
  gloss: GT03_GLOSS_BLACK,
  satin: GT03_SATIN_BLACK,
});

export const GT_04_MODEL = gtModel({
  brandName: GT04_BRAND_NAME,
  slug: 'gt-04',
  brushed: GT04_BRUSHED_ALUMINUM,
  gloss: GT04_GLOSS_BLACK,
  satin: GT04_SATIN_BLACK,
});

export const GT_FORGED_MODELS = [GT_01_MODEL, GT_02_MODEL, GT_03_MODEL, GT_04_MODEL];
