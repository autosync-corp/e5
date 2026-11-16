import { buildWheelUrl } from '@/core/utils/wheelUrl';
import {
  LAGUNA_BRAND_NAME,
  LAGUNA_FINISHING_BG,
  LAGUNA_HERO,
  LAGUNA_VETTE_GALLERY,
  LAGUNA_WHEEL_GALLERY_BANNER,
  LAGUNA_WHEEL_RENDER,
  SONOMA_BRAND_NAME,
  SONOMA_BRUSHED_ALUMINUM,
  SONOMA_DETAIL_3,
  SONOMA_HERO_IMAGE,
  SONOMA_VETTE_GALLERY_BANNER,
  TALLADEGA_BRAND_NAME,
  TALLADEGA_BRUSHED_ALUMINUM,
  TALLADEGA_HERO,
  TALLADEGA_SHOT_1,
  TALLADEGA_SHOT_2,
  WHEEL_GALLERY_STUDIO_BANNER,
} from '@/pages/wheels/constants/Wheels.ts';
import { VETTE_GALLERY_IMAGE_1 } from '@/pages/gallery/constants/Images.ts';

export interface ForgedFinish {
  name: string;
  image: string;
  href: string;
  call: boolean;
  priceLabel?: string;
}

export interface ForgedModel {
  brandName: string;
  displayName: string;
  h1: string;
  exclusive: string;
  title: string;
  description: string;
  canonicalPath: string;
  ogImage: string;
  heroImage: string;
  heroAlt: string;
  heroNameClass: string;
  wheelImage: string;
  wheelAlt: string;
  frontSize: string;
  rearSize: string;
  boltPattern: string;
  shopFitmentHref: string;
  shopFitmentLabel: string;
  /** When set, SIZE lists these catalog sizes instead of a single [F]/[R] pair. */
  sizeLines?: string[];
  /** Default true. GT pages omit the E5 Forged process/finishing essays. */
  showProcessSections?: boolean;
  /** `null` hides the second specs CTA. */
  exploreHref?: string | null;
  exploreLabel?: string;
  heroFit?: 'cover' | 'contain';
  finishes: ForgedFinish[];
  finishingBg: string;
  spinImage: string;
  spinAlt: string;
  spinFit: 'cover' | 'contain';
  vetteGalleryImage: string;
  vetteGalleryAlt: string;
  wheelGalleryImage: string;
  productSchemaName: string;
  schemaOffers?: { lowPrice: string; highPrice: string };
  /** Optional series wordmark shown above the H1 (GT FORGED on GT pages). */
  seriesLogo?: { src: string; alt: string };
}

const IMG = 'https://wheels.autosyncstudio.com/webp';

export const SONOMA_MODEL: ForgedModel = {
  brandName: SONOMA_BRAND_NAME,
  displayName: 'SONOMA',
  h1: 'SONOMA FULLY FORGED CORVETTE WHEELS (C8)',
  exclusive: 'EXCLUSIVELY FORGED FOR C8 Z06, ZR1, E-RAY.',
  title: 'Sonoma Fully Forged Corvette Wheels (C8) | E5 Wheels',
  description:
    'Sonoma fully forged wheels (C8 Z06, ZR1, E-Ray) with Corvette-only 20x10 +25mm / 21x13 +20mm fitment. Brushed aluminum, gloss black, titanium, and bronze.',
  canonicalPath: '/wheels/sonoma',
  ogImage: SONOMA_HERO_IMAGE,
  heroImage: SONOMA_HERO_IMAGE,
  heroAlt: 'Sonoma forged wheel close-up',
  heroNameClass: 'text-black drop-shadow-[0_1px_8px_rgba(255,255,255,0.45)]',
  wheelImage: SONOMA_BRUSHED_ALUMINUM,
  wheelAlt: 'Sonoma forged wheel in Brushed Aluminum',
  frontSize: '20 x 10 / +25mm',
  rearSize: '21 x 13 / +20mm',
  boltPattern: '5x120.65',
  shopFitmentHref: buildWheelUrl(SONOMA_BRAND_NAME, 'Brushed Aluminum'),
  shopFitmentLabel: 'SHOP FITMENT',
  finishes: [
    {
      name: 'Brushed Aluminum',
      image: `${IMG}/E5/Sonoma_AB_Brushed_Aluminum_5-lug_0001.webp`,
      href: buildWheelUrl(SONOMA_BRAND_NAME, 'Brushed Aluminum'),
      call: false,
      priceLabel: '$11,600.00 - $12,400.00',
    },
    {
      name: 'Gloss Black',
      image: `${IMG}/E5/Sonoma_BK_Gloss_Black_5-lug_0001.webp`,
      href: buildWheelUrl(SONOMA_BRAND_NAME, 'Gloss Black'),
      call: false,
      priceLabel: '$11,200.00 - $12,000.00',
    },
    {
      name: 'Polished',
      image: `${IMG}/E5/Sonoma_PO_Polished_5-lug_0001.webp`,
      href: buildWheelUrl(SONOMA_BRAND_NAME, 'Polished'),
      call: false,
      priceLabel: '$11,600.00 - $12,400.00',
    },
    {
      name: 'Satin Black',
      image: `${IMG}/E5/Sonoma_SB_Satin_Black_5-lug_0001.webp`,
      href: buildWheelUrl(SONOMA_BRAND_NAME, 'Satin Black'),
      call: false,
      priceLabel: '$11,200.00 - $12,000.00',
    },
  ],
  finishingBg: SONOMA_DETAIL_3,
  spinImage: '/assets/images/sonoma/sonoma_stills_banner.webp',
  spinAlt: 'Sonoma forged wheels',
  spinFit: 'cover',
  vetteGalleryImage: SONOMA_VETTE_GALLERY_BANNER,
  vetteGalleryAlt: 'Corvette builds fitted with E5 Sonoma wheels',
  wheelGalleryImage: WHEEL_GALLERY_STUDIO_BANNER,
  productSchemaName: 'E5 Sonoma Forged Corvette Wheel',
  schemaOffers: { lowPrice: '11200', highPrice: '12400' },
};

export const TALLADEGA_MODEL: ForgedModel = {
  brandName: TALLADEGA_BRAND_NAME,
  displayName: 'TALLADEGA',
  h1: 'TALLADEGA FULLY FORGED CORVETTE WHEELS (C8)',
  exclusive: 'EXCLUSIVELY FORGED FOR C8 Z06, ZR1, E-RAY.',
  title: 'Talladega Fully Forged Corvette Wheels (C8) | E5 Wheels',
  description:
    'Talladega fully forged wheels (C8 Z06, ZR1, E-Ray) with Corvette-only 20x10 +25mm / 21x13 +20mm fitment. Brushed aluminum, gloss black, and podium finishes.',
  canonicalPath: '/wheels/talladega',
  ogImage: TALLADEGA_HERO,
  heroImage: TALLADEGA_SHOT_1,
  heroAlt: 'Talladega forged wheel close-up',
  heroNameClass: 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]',
  wheelImage: TALLADEGA_BRUSHED_ALUMINUM,
  wheelAlt: 'Talladega forged wheel in Brushed Aluminum',
  frontSize: '20 x 10 / +25mm',
  rearSize: '21 x 13 / +20mm',
  boltPattern: '5x120.65',
  shopFitmentHref: buildWheelUrl(TALLADEGA_BRAND_NAME, 'Brushed Aluminum'),
  shopFitmentLabel: 'SHOP FITMENT',
  finishes: [
    {
      name: 'Brushed Aluminum',
      image: `${IMG}/E5/Talladega_AB_Brushed_Aluminum_5-lug_0001.webp`,
      href: buildWheelUrl(TALLADEGA_BRAND_NAME, 'Brushed Aluminum'),
      call: false,
      priceLabel: '$11,600.00 - $12,400.00',
    },
    {
      name: 'Gloss Black',
      image: `${IMG}/E5/Talladega_BK_Gloss_Black_5-lug_e5ta2010e25520bk_0001.webp`,
      href: buildWheelUrl(TALLADEGA_BRAND_NAME, 'Gloss Black'),
      call: false,
      priceLabel: '$11,600.00 - $12,400.00',
    },
    {
      name: 'Polished',
      image: `${IMG}/E5/Talladega_AB_Brushed_Aluminum_5-lug_0001.webp`,
      href: buildWheelUrl(TALLADEGA_BRAND_NAME, 'Polished'),
      call: false,
      priceLabel: '$11,600.00 - $12,400.00',
    },
    {
      name: 'Satin Black',
      image: `${IMG}/E5/Talladega_BK_Gloss_Black_5-lug_e5ta2010e25520bk_0001.webp`,
      href: buildWheelUrl(TALLADEGA_BRAND_NAME, 'Satin Black'),
      call: false,
      priceLabel: '$11,200.00 - $12,000.00',
    },
  ],
  finishingBg: TALLADEGA_SHOT_1,
  spinImage: TALLADEGA_SHOT_2,
  spinAlt: 'Talladega forged wheel',
  spinFit: 'cover',
  vetteGalleryImage: VETTE_GALLERY_IMAGE_1,
  vetteGalleryAlt: 'Corvette builds fitted with E5 wheels',
  wheelGalleryImage: WHEEL_GALLERY_STUDIO_BANNER,
  productSchemaName: 'E5 Talladega Forged Corvette Wheel',
  schemaOffers: { lowPrice: '11200', highPrice: '12400' },
};

export const LAGUNA_MODEL: ForgedModel = {
  brandName: LAGUNA_BRAND_NAME,
  displayName: 'LAGUNA',
  h1: 'LAGUNA FULLY FORGED CORVETTE WHEELS (C8)',
  exclusive: 'EXCLUSIVELY FORGED FOR C8 Z06, ZR1 / X, E-RAY, GRAND SPORT / X',
  title: 'Laguna Fully Forged Corvette Wheels (C8) | E5 Wheels',
  description:
    'Laguna fully forged wheels (C8 Z06, ZR1, E-Ray) with Corvette-only 20x10 +25mm / 21x13 +20mm fitment. Brushed aluminum, satin black, polished, and gloss black.',
  canonicalPath: '/wheels/laguna',
  ogImage: LAGUNA_HERO,
  heroImage: LAGUNA_FINISHING_BG,
  heroAlt: 'Laguna forged wheel close-up',
  heroNameClass: 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]',
  wheelImage: LAGUNA_WHEEL_RENDER,
  wheelAlt: 'E5 Laguna forged wheel in Brushed Aluminum finish',
  frontSize: '20 x 10 / +25mm',
  rearSize: '21 x 13 / +20mm',
  boltPattern: '5x120.65',
  shopFitmentHref: buildWheelUrl(LAGUNA_BRAND_NAME, 'Brushed Aluminum'),
  shopFitmentLabel: 'SHOP FITMENT',
  finishes: [
    {
      name: 'Brushed Aluminum',
      image: LAGUNA_WHEEL_RENDER,
      href: buildWheelUrl(LAGUNA_BRAND_NAME, 'Brushed Aluminum'),
      call: false,
      priceLabel: '$11,600.00 - $12,400.00',
    },
    {
      name: 'Satin Black',
      image: `${IMG}/E5/Laguna_SB_Satin_Black_Front_5-lug_0001.webp`,
      href: buildWheelUrl(LAGUNA_BRAND_NAME, 'Satin Black'),
      call: false,
      priceLabel: '$11,200.00 - $12,000.00',
    },
    {
      name: 'Polished',
      image: `${IMG}/E5/Laguna_PO_Polished_Front_5-lug_0001.webp`,
      href: buildWheelUrl(LAGUNA_BRAND_NAME, 'Polished'),
      call: false,
      priceLabel: '$11,600.00 - $12,400.00',
    },
    {
      name: 'Gloss Black',
      image: `${IMG}/E5/Laguna_BK_Gloss_Black_Front_5-lug_0001.webp`,
      href: buildWheelUrl(LAGUNA_BRAND_NAME, 'Gloss Black'),
      call: false,
      priceLabel: '$11,200.00 - $12,000.00',
    },
  ],
  finishingBg: LAGUNA_FINISHING_BG,
  spinImage: LAGUNA_WHEEL_RENDER,
  spinAlt: 'Laguna forged wheel',
  spinFit: 'contain',
  vetteGalleryImage: LAGUNA_VETTE_GALLERY,
  vetteGalleryAlt: 'Corvette builds fitted with E5 Laguna wheels',
  wheelGalleryImage: LAGUNA_WHEEL_GALLERY_BANNER,
  productSchemaName: 'E5 Laguna Forged Corvette Wheel',
  schemaOffers: { lowPrice: '11200', highPrice: '12400' },
};

export const FORGING_STEPS = [
  {
    image: '/assets/images/process/forged/f0f3e57be69ac17bdf5d0b88a9acbb4dd11c959e.webp',
    caption: 'MATERIAL',
  },
  {
    image: '/assets/images/process/forged/809caca77164233a698d905f1d587df976aea6e3.webp',
    caption: 'FORGING',
  },
  {
    image: '/assets/images/process/forged/797d5893d4a0bae48a4ccb031cafc436db1200ca.webp',
    caption: 'MACHINE',
  },
  {
    image: '/assets/images/process/forged/b9590fdbbe1a9e6203dbf8fe826d0dafe9f7baba.webp',
    caption: 'REFINE',
  },
  {
    image: '/assets/images/process/forged/bb6950e1bfd656ac155d1f7e1c229877ded3a542.webp',
    caption: 'FINISH',
  },
] as const;
