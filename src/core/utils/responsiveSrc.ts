export type PictureSources = {
  src: string;
  webp?: string;
  avif?: string;
  sizes: string;
};

const CATALOG_RE = /\/assets\/images\/catalog-800\/([^/]+)\.webp$/;
const BANNER_RE = /\/assets\/images\/banner\/(bf-sale|gt03-black|viz-0[1-4]|film-poster)(?:-1280)?\.webp$/;

const BANNER_SRCSET = (stem: string, ext: 'avif' | 'webp') =>
  `/assets/images/banner/${stem}-400.${ext} 400w, /assets/images/banner/${stem}-600.${ext} 600w, /assets/images/banner/${stem}-800.${ext} 800w, /assets/images/banner/${stem}-1280.${ext} 1280w, /assets/images/banner/${stem}-1920.${ext} 1920w`;

export function bannerPicture(
  stem: string,
  sizes = '(max-width: 1023px) 100vw, (max-width: 1599px) 1280px, 1920px',
): PictureSources {
  return {
    src: `/assets/images/banner/${stem}-1280.webp`,
    avif: BANNER_SRCSET(stem, 'avif'),
    webp: BANNER_SRCSET(stem, 'webp'),
    sizes,
  };
}

export function gt03LaydownPicture(sizes = '(min-width: 768px) 46vw, 1px'): PictureSources {
  return {
    src: '/assets/images/banner/gt03-laydown-1500.webp',
    avif: '/assets/images/banner/gt03-laydown-800.avif 800w, /assets/images/banner/gt03-laydown-1200.avif 1200w, /assets/images/banner/gt03-laydown-1500.avif 1500w',
    webp: '/assets/images/banner/gt03-laydown-800.webp 800w, /assets/images/banner/gt03-laydown-1200.webp 1200w, /assets/images/banner/gt03-laydown-1500.webp 1500w',
    sizes,
  };
}

export function pictureFor(src: string, sizes: string): PictureSources | null {
  const catalog = src.match(CATALOG_RE);
  if (catalog) {
    const stem = catalog[1];
    return {
      src,
      avif: `/assets/images/catalog-200/${stem}.avif 200w, /assets/images/catalog-400/${stem}.avif 400w, /assets/images/catalog-800/${stem}.avif 800w`,
      webp: `/assets/images/catalog-200/${stem}.webp 200w, /assets/images/catalog-400/${stem}.webp 400w, ${src} 800w`,
      sizes,
    };
  }

  const banner = src.match(BANNER_RE);
  if (banner) {
    return bannerPicture(banner[1], sizes);
  }

  const named: Record<string, PictureSources> = {
    '/assets/images/vette-black-on-river.webp': {
      src,
      avif: '/assets/images/opt/vette-black-on-river-400.avif 400w, /assets/images/opt/vette-black-on-river-800.avif 800w',
      webp: '/assets/images/opt/vette-black-on-river-400.webp 400w, /assets/images/opt/vette-black-on-river-800.webp 800w, /assets/images/vette-black-on-river.webp 1080w',
      sizes,
    },
    '/assets/images/e5-wheel-home-shot-1.webp': {
      src,
      avif: '/assets/images/opt/e5-wheel-home-shot-1-400.avif 400w, /assets/images/opt/e5-wheel-home-shot-1-800.avif 800w',
      webp: '/assets/images/opt/e5-wheel-home-shot-1-400.webp 400w, /assets/images/opt/e5-wheel-home-shot-1-800.webp 800w, /assets/images/e5-wheel-home-shot-1.webp 1080w',
      sizes,
    },
    '/assets/images/asset-29.webp': {
      src,
      avif: '/assets/images/opt/asset-29-264.avif 264w, /assets/images/opt/asset-29-528.avif 528w',
      // 528.webp is larger than the original 697.webp — skip it.
      webp: '/assets/images/opt/asset-29-264.webp 264w, /assets/images/asset-29.webp 697w',
      sizes,
    },
    '/assets/images/wheels-new/195456d72b224f9b92ca6b410ac88f61fad3db24.webp': {
      src,
      avif: '/assets/images/opt/195456d72b224f9b92ca6b410ac88f61fad3db24-800.avif 800w, /assets/images/opt/195456d72b224f9b92ca6b410ac88f61fad3db24-1200.avif 1200w',
      webp: '/assets/images/opt/195456d72b224f9b92ca6b410ac88f61fad3db24-800.webp 800w, /assets/images/opt/195456d72b224f9b92ca6b410ac88f61fad3db24-1200.webp 1200w, /assets/images/wheels-new/195456d72b224f9b92ca6b410ac88f61fad3db24.webp 1620w',
      sizes,
    },
    '/assets/images/wheels-new/38f473e1f45f9c800e13c02c7283b158fad81634.webp': {
      src,
      avif: '/assets/images/opt/38f473e1f45f9c800e13c02c7283b158fad81634-800.avif 800w, /assets/images/opt/38f473e1f45f9c800e13c02c7283b158fad81634-1200.avif 1200w',
      webp: '/assets/images/opt/38f473e1f45f9c800e13c02c7283b158fad81634-800.webp 800w, /assets/images/opt/38f473e1f45f9c800e13c02c7283b158fad81634-1200.webp 1200w, /assets/images/wheels-new/38f473e1f45f9c800e13c02c7283b158fad81634.webp 1620w',
      sizes,
    },
  };

  return named[src] ?? null;
}

export const LOGO_SRCSET: Record<string, string> = {
  '/assets/images/logos/form-forged.png':
    '/assets/images/opt/form-forged-800.png 800w, /assets/images/logos/form-forged.png 1559w',
  '/assets/images/logos/gt-forged.png':
    '/assets/images/opt/gt-forged-600.png 600w, /assets/images/logos/gt-forged.png 1176w',
  '/assets/images/logos/2p-forged.png':
    '/assets/images/opt/2p-forged-400.png 400w, /assets/images/logos/2p-forged.png 765w',
  '/assets/images/e5-wheels-alt-logo-black.png':
    '/assets/images/opt/e5-wheels-alt-logo-black-600.png 600w, /assets/images/e5-wheels-alt-logo-black.png 1191w',
};

export const SOCIAL_SRC: Record<string, string> = {
  '/assets/images/e5_tiktok.webp': '/assets/images/opt/e5_tiktok-96.webp',
  '/assets/images/e5_instagram.webp': '/assets/images/opt/e5_instagram-96.webp',
  '/assets/images/e5_youtube.webp': '/assets/images/opt/e5_youtube-96.webp',
  '/assets/images/e5_facebook.webp': '/assets/images/opt/e5_facebook-96.webp',
};
