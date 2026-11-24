import { Redis } from '@upstash/redis';
import {
  FACEBOOK_MEDIA_ICON,
  INSTAGRAM_MEDIA_ICON,
  TIKTOK_MEDIA_ICON,
  YOUTUBE_MEDIA_ICON,
} from '@/core/constants/App.ts';
import {
  ABOUT_ROUTE,
  CATALOG_ROUTE,
  CONTACT_ROUTE,
  GALLERY_VEHICLES_ROUTE,
  GALLERY_WHEELS_ROUTE,
  GENERATIONS_ROUTE,
  GENERATIONS_C5_BASE_ROUTE,
  GENERATIONS_C5_Z06_ROUTE,
  GENERATIONS_C6_ROUTE,
  GENERATIONS_C6_Z06_ROUTE,
  GENERATIONS_C6_ZR1_ROUTE,
  GENERATIONS_C6_GRAND_SPORT_ROUTE,
  GENERATIONS_C7_STINGRAY_ROUTE,
  GENERATIONS_C7_GRAND_SPORT_ROUTE,
  GENERATIONS_C7_Z06_ROUTE,
  GENERATIONS_C7_ZR1_ROUTE,
  GENERATIONS_C8_STINGRAY_ROUTE,
  GENERATIONS_C8_Z06_ROUTE,
  GENERATIONS_C8_ZR1_ROUTE,
  GENERATIONS_C8_E_RAY_ROUTE,
  INSTALLATION_ROUTE,
  INTERACTIVE_GALLERY_ROUTE,
  MEDIA_ROUTE,
  PRIVACY_ROUTE,
  PROCESS_ROUTE,
  PROCESS_FORGED_ROUTE,
  PROCESS_FORM_FORGED_ROUTE,
  REFUND_ROUTE,
  REGISTRATION_ROUTE,
  TERMS_ROUTE,
  VENDOR_REGISTRATION_ROUTE,
  VISUALIZE_ROUTE,
  WARRANTY_ROUTE,
  WHEELS_ROUTE,
  WHEELS_DAYTONA_ROUTE,
  WHEELS_TALLADEGA_ROUTE,
  WHEELS_SEBRING_ROUTE,
  WHEELS_SEBRING_2P_ROUTE,
  WHEELS_SPEEDWAY_ROUTE,
  WHEELS_SONOMA_ROUTE,
  WHEELS_LAGUNA_ROUTE,
  WHEELS_GT_01_ROUTE,
  WHEELS_GT_02_ROUTE,
  WHEELS_GT_03_ROUTE,
  WHEELS_GT_04_ROUTE,
} from '@/core/constants/Routes.ts';

export const NAV_REDIS_KEY = 'e5:portal:nav';
export const NAV_DOC_VERSION = 1;
export const MAX_HEADER_ITEMS = 12;
export const MAX_CHILDREN = 24;
export const MAX_COLUMNS = 6;
export const MAX_COLUMN_LINKS = 16;
export const MAX_SOCIALS = 8;
export const MAX_LEGAL = 6;

const MAX = {
  id: 40,
  label: 48,
  href: 300,
  group: 40,
  badge: 12,
  heading: 40,
  match: 80,
  address: 160,
} as const;

export const HEADER_MENUS = ['plain', 'wheels', 'generations', 'visualize'] as const;
export type HeaderMenu = (typeof HEADER_MENUS)[number];
export const HEADER_ALIGNS = ['left', 'right'] as const;
export type HeaderAlign = (typeof HEADER_ALIGNS)[number];
export const SOCIAL_NETWORKS = ['instagram', 'facebook', 'youtube', 'tiktok'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export type NavChild = {
  id: string;
  label: string;
  href: string;
  hidden: boolean;
  group: string;
  badge: string;
};

export type HeaderItem = {
  id: string;
  label: string;
  href: string;
  hidden: boolean;
  align: HeaderAlign;
  menu: HeaderMenu;
  matches: string[];
  children: NavChild[];
};

export type FooterLink = {
  id: string;
  label: string;
  href: string;
  hidden: boolean;
};

export type FooterColumn = {
  id: string;
  heading: string;
  hidden: boolean;
  links: FooterLink[];
};

export type FooterContact = {
  hidden: boolean;
  addressLines: string[];
  addressHref: string;
  phoneLabel: string;
  phoneHref: string;
  emailLabel: string;
  emailHref: string;
};

export type FooterSocial = {
  id: string;
  network: SocialNetwork;
  href: string;
  label: string;
  hidden: boolean;
};

export type FooterCta = {
  hidden: boolean;
  label: string;
  href: string;
};

export type SiteNav = {
  version: number;
  header: HeaderItem[];
  footer: {
    columns: FooterColumn[];
    contact: FooterContact;
    socials: FooterSocial[];
    cta: FooterCta;
    legal: FooterLink[];
  };
};

export type PublicNavChild = Omit<NavChild, 'hidden'>;
export type PublicHeaderItem = Omit<HeaderItem, 'hidden' | 'children'> & {
  children: PublicNavChild[];
};
export type PublicFooterLink = Omit<FooterLink, 'hidden'>;
export type PublicFooterColumn = Omit<FooterColumn, 'hidden' | 'links'> & {
  links: PublicFooterLink[];
};
export type PublicFooterSocial = Omit<FooterSocial, 'hidden'> & {
  src: string;
  alt: string;
};

export type PublicFooter = {
  columns: PublicFooterColumn[];
  contact: FooterContact | null;
  socials: PublicFooterSocial[];
  cta: Omit<FooterCta, 'hidden'> | null;
  legal: PublicFooterLink[];
};

export type PublicSiteNav = {
  header: PublicHeaderItem[];
  footer: PublicFooter;
};

const SOCIAL_ICONS: Record<SocialNetwork, { src: string; alt: string }> = {
  instagram: { src: INSTAGRAM_MEDIA_ICON, alt: 'Instagram' },
  facebook: { src: FACEBOOK_MEDIA_ICON, alt: 'Facebook' },
  youtube: { src: YOUTUBE_MEDIA_ICON, alt: 'YouTube' },
  tiktok: { src: TIKTOK_MEDIA_ICON, alt: 'TikTok' },
};

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  return fromMeta || '';
}

function portalRedis(): Redis | null {
  try {
    const url = env('KV_REST_API_URL');
    const token = env('KV_REST_API_TOKEN');
    if (url && token) return new Redis({ url, token });
  } catch {
    /* Redis unavailable */
  }
  return null;
}

function child(id: string, label: string, href: string, extra: Partial<NavChild> = {}): NavChild {
  return { id, label, href, hidden: false, group: '', badge: '', ...extra };
}

function item(
  id: string,
  label: string,
  href: string,
  align: HeaderAlign,
  menu: HeaderMenu,
  matches: string[],
  children: NavChild[],
): HeaderItem {
  return { id, label, href, hidden: false, align, menu, matches, children };
}

export function seedSiteNav(): SiteNav {
  return {
    version: NAV_DOC_VERSION,
    header: [
      item('wheels', 'WHEELS', WHEELS_ROUTE, 'left', 'wheels', [WHEELS_ROUTE], [
        child('daytona', 'DAYTONA', WHEELS_DAYTONA_ROUTE, { group: 'FORM FORGED' }),
        child('sebring', 'SEBRING', WHEELS_SEBRING_ROUTE, { group: 'FORM FORGED' }),
        child('speedway', 'SPEEDWAY', WHEELS_SPEEDWAY_ROUTE, { group: 'FORM FORGED' }),
        child('sebring-2p', 'SEBRING 2P', WHEELS_SEBRING_2P_ROUTE, { group: '2P FORGED' }),
        child('sonoma', 'SONOMA', WHEELS_SONOMA_ROUTE, { group: 'E5 FORGED' }),
        child('talladega', 'TALLADEGA', WHEELS_TALLADEGA_ROUTE, { group: 'E5 FORGED' }),
        child('laguna', 'LAGUNA', WHEELS_LAGUNA_ROUTE, { group: 'E5 FORGED' }),
        child('gt-01', 'GT.01', WHEELS_GT_01_ROUTE, { group: 'GT FORGED' }),
        child('gt-02', 'GT.02', WHEELS_GT_02_ROUTE, { group: 'GT FORGED' }),
        child('gt-03', 'GT.03', WHEELS_GT_03_ROUTE, { group: 'GT FORGED' }),
        child('gt-04', 'GT.04', WHEELS_GT_04_ROUTE, { group: 'GT FORGED' }),
      ]),
      item('gallery', 'GALLERY', GALLERY_VEHICLES_ROUTE, 'left', 'plain', ['/gallery'], [
        child('gallery-vehicles', 'VEHICLES', GALLERY_VEHICLES_ROUTE),
        child('gallery-wheels', 'WHEELS', GALLERY_WHEELS_ROUTE),
        child('gallery-ai', 'AI GALLERY', INTERACTIVE_GALLERY_ROUTE, { badge: 'NEW' }),
      ]),
      item('process', 'PROCESS', PROCESS_ROUTE, 'left', 'plain', [PROCESS_ROUTE], [
        child('process-forged', 'FORGED', PROCESS_FORGED_ROUTE),
        child('process-form', 'FORM FORGED', PROCESS_FORM_FORGED_ROUTE),
      ]),
      item('generations', 'GENERATIONS', GENERATIONS_ROUTE, 'right', 'generations', [GENERATIONS_ROUTE], [
        child('c8-stingray', 'Stingray', GENERATIONS_C8_STINGRAY_ROUTE, { group: 'C8 2020-2026' }),
        child('c8-z06', 'Z06', GENERATIONS_C8_Z06_ROUTE, { group: 'C8 2020-2026' }),
        child('c8-zr1', 'ZR1', GENERATIONS_C8_ZR1_ROUTE, { group: 'C8 2020-2026' }),
        child('c8-eray', 'E-Ray', GENERATIONS_C8_E_RAY_ROUTE, { group: 'C8 2020-2026' }),
        child('c7-stingray', 'Stingray', GENERATIONS_C7_STINGRAY_ROUTE, { group: 'C7 2014-2019' }),
        child('c7-grand-sport', 'Grand Sport', GENERATIONS_C7_GRAND_SPORT_ROUTE, { group: 'C7 2014-2019' }),
        child('c7-z06', 'Z06', GENERATIONS_C7_Z06_ROUTE, { group: 'C7 2014-2019' }),
        child('c7-zr1', 'ZR1', GENERATIONS_C7_ZR1_ROUTE, { group: 'C7 2014-2019' }),
        child('c6-base', 'Base Model', GENERATIONS_C6_ROUTE, { group: 'C6 2005-2013' }),
        child('c6-grand-sport', 'Grand Sport', GENERATIONS_C6_GRAND_SPORT_ROUTE, { group: 'C6 2005-2013' }),
        child('c6-z06', 'Z06', GENERATIONS_C6_Z06_ROUTE, { group: 'C6 2005-2013' }),
        child('c6-zr1', 'ZR1', GENERATIONS_C6_ZR1_ROUTE, { group: 'C6 2005-2013' }),
        child('c5-base', 'Base', GENERATIONS_C5_BASE_ROUTE, { group: 'C5 1997-2004' }),
        child('c5-z06', 'Z06', GENERATIONS_C5_Z06_ROUTE, { group: 'C5 1997-2004' }),
      ]),
      item('visualize', 'VISUALIZE', VISUALIZE_ROUTE, 'right', 'visualize', [VISUALIZE_ROUTE, INTERACTIVE_GALLERY_ROUTE], [
        child('visualize-ai', 'AI GALLERY', INTERACTIVE_GALLERY_ROUTE, { badge: 'NEW' }),
        child('visualize-wheels', 'WHEEL VISUALIZER', VISUALIZE_ROUTE),
      ]),
      item('contact', 'CONTACT', CONTACT_ROUTE, 'right', 'plain', [CONTACT_ROUTE], []),
    ],
    footer: {
      columns: [
        {
          id: 'explore',
          heading: 'Explore',
          hidden: false,
          links: [
            { id: 'explore-process', label: 'OUR PROCESS', href: PROCESS_ROUTE, hidden: false },
            { id: 'explore-contact', label: 'CONTACT US', href: CONTACT_ROUTE, hidden: false },
            { id: 'explore-events', label: 'EVENTS', href: '/events/upcoming', hidden: false },
            { id: 'explore-catalog', label: 'CATALOG', href: CATALOG_ROUTE, hidden: false },
          ],
        },
        {
          id: 'support',
          heading: 'Support',
          hidden: false,
          links: [
            { id: 'support-return', label: 'RETURN POLICY', href: REFUND_ROUTE, hidden: false },
            { id: 'support-warranty', label: 'WARRANTY', href: WARRANTY_ROUTE, hidden: false },
            { id: 'support-install', label: 'INSTALLATION GUIDELINES', href: INSTALLATION_ROUTE, hidden: false },
            { id: 'support-registration', label: 'WHEEL REGISTRATION', href: REGISTRATION_ROUTE, hidden: false },
          ],
        },
        {
          id: 'company',
          heading: 'Company',
          hidden: false,
          links: [
            { id: 'company-vendor', label: 'VENDOR REGISTRATION', href: VENDOR_REGISTRATION_ROUTE, hidden: false },
            { id: 'company-media', label: 'MEDIA', href: MEDIA_ROUTE, hidden: false },
            { id: 'company-about', label: 'ABOUT US', href: ABOUT_ROUTE, hidden: false },
            { id: 'company-blog', label: 'BLOG', href: '/blog', hidden: false },
          ],
        },
      ],
      contact: {
        hidden: false,
        addressLines: ['E5 WHEELS, LLC', '3500 NW 77 CT', 'DORAL, FL 33122'],
        addressHref: 'https://maps.app.goo.gl/Xe5EHmAQb11B4Nar8',
        phoneLabel: '(305) 964-7429',
        phoneHref: 'tel:+13059647429',
        emailLabel: 'SALES@E5WHEELS.COM',
        emailHref: 'mailto:SALES@E5WHEELS.COM',
      },
      socials: [
        {
          id: 'instagram',
          network: 'instagram',
          href: 'https://www.instagram.com/e5wheels/',
          label: 'E5 Wheels on Instagram',
          hidden: false,
        },
        {
          id: 'facebook',
          network: 'facebook',
          href: 'https://www.facebook.com/e5wheels/',
          label: 'E5 Wheels on Facebook',
          hidden: false,
        },
        {
          id: 'youtube',
          network: 'youtube',
          href: 'https://www.youtube.com/@E5Wheels',
          label: 'E5 Wheels on YouTube',
          hidden: false,
        },
        {
          id: 'tiktok',
          network: 'tiktok',
          href: 'https://www.tiktok.com/@e5wheels',
          label: 'E5 Wheels on TikTok',
          hidden: false,
        },
      ],
      cta: { hidden: false, label: 'GET IN TOUCH', href: CONTACT_ROUTE },
      legal: [
        { id: 'terms', label: 'TERMS & CONDITIONS', href: TERMS_ROUTE, hidden: false },
        { id: 'privacy', label: 'PRIVACY POLICY', href: PRIVACY_ROUTE, hidden: false },
      ],
    },
  };
}

export const DEFAULT_SITE_NAV = seedSiteNav();

function clip(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\0/g, '')
    .trim()
    .slice(0, max);
}

const ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const SITE_PATH_RE = /^\/(?!\/)[\w\-./?#%&=+]{0,298}$/;
const TEL_RE = /^tel:\+?[0-9().-]{7,20}$/i;
const MAIL_RE = /^mailto:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const E5_HOSTS = new Set(['www.e5wheels.com', 'e5wheels.com']);
const SOCIAL_HOSTS: Record<string, (path: string) => boolean> = {
  'instagram.com': (path) => path.toLowerCase().startsWith('/e5wheels'),
  'www.instagram.com': (path) => path.toLowerCase().startsWith('/e5wheels'),
  'facebook.com': (path) => path.toLowerCase().startsWith('/e5wheels'),
  'www.facebook.com': (path) => path.toLowerCase().startsWith('/e5wheels'),
  'youtube.com': (path) => {
    const p = path.toLowerCase();
    return p.startsWith('/@e5wheels') || p.startsWith('/e5wheels');
  },
  'www.youtube.com': (path) => {
    const p = path.toLowerCase();
    return p.startsWith('/@e5wheels') || p.startsWith('/e5wheels');
  },
  'tiktok.com': (path) => path.toLowerCase().startsWith('/@e5wheels'),
  'www.tiktok.com': (path) => path.toLowerCase().startsWith('/@e5wheels'),
};

function isMapsHost(host: string, path: string): boolean {
  if (host === 'maps.app.goo.gl') return true;
  if (host === 'maps.google.com' || host === 'www.google.com') {
    return path === '/maps' || path.startsWith('/maps/');
  }
  return false;
}

export function isAllowedNavHref(href: string): boolean {
  if (!href) return false;
  if (/[\s<>]/.test(href)) return false;
  if (/^(javascript|data|vbscript|file):/i.test(href)) return false;
  if (SITE_PATH_RE.test(href)) return true;
  if (TEL_RE.test(href) || MAIL_RE.test(href)) return true;
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (E5_HOSTS.has(host)) return true;
    const social = SOCIAL_HOSTS[host];
    if (social) return social(url.pathname);
    if (isMapsHost(host, url.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

function isMenu(value: unknown): value is HeaderMenu {
  return HEADER_MENUS.includes(value as HeaderMenu);
}

function isAlign(value: unknown): value is HeaderAlign {
  return HEADER_ALIGNS.includes(value as HeaderAlign);
}

function isNetwork(value: unknown): value is SocialNetwork {
  return SOCIAL_NETWORKS.includes(value as SocialNetwork);
}

function uniqueId(raw: string, used: Set<string>, fallback: string): string {
  let id = raw;
  if (!ID_RE.test(id)) id = fallback;
  let n = 2;
  let candidate = id;
  while (used.has(candidate)) {
    candidate = `${id}-${n}`.slice(0, 40);
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

function normalizeChild(raw: unknown, index: number, used: Set<string>): NavChild {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: uniqueId(clip(row.id, MAX.id).toLowerCase(), used, `child-${index + 1}`),
    label: clip(row.label, MAX.label),
    href: clip(row.href, MAX.href),
    hidden: Boolean(row.hidden),
    group: clip(row.group, MAX.group),
    badge: clip(row.badge, MAX.badge),
  };
}

function normalizeHeaderItem(raw: unknown, index: number, used: Set<string>): HeaderItem {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const childUsed = new Set<string>();
  const children = Array.isArray(row.children)
    ? row.children.slice(0, MAX_CHILDREN).map((childRow, i) => normalizeChild(childRow, i, childUsed))
    : [];
  const matches = Array.isArray(row.matches)
    ? row.matches.map((m) => clip(m, MAX.match)).filter(Boolean).slice(0, 8)
    : [];
  return {
    id: uniqueId(clip(row.id, MAX.id).toLowerCase(), used, `item-${index + 1}`),
    label: clip(row.label, MAX.label),
    href: clip(row.href, MAX.href),
    hidden: Boolean(row.hidden),
    align: isAlign(row.align) ? row.align : 'left',
    menu: isMenu(row.menu) ? row.menu : 'plain',
    matches,
    children,
  };
}

function normalizeFooterLink(raw: unknown, index: number, used: Set<string>, fallback: string): FooterLink {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    id: uniqueId(clip(row.id, MAX.id).toLowerCase(), used, `${fallback}-${index + 1}`),
    label: clip(row.label, MAX.label),
    href: clip(row.href, MAX.href),
    hidden: Boolean(row.hidden),
  };
}

function normalizeColumn(raw: unknown, index: number, used: Set<string>): FooterColumn {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const linkUsed = new Set<string>();
  const links = Array.isArray(row.links)
    ? row.links.slice(0, MAX_COLUMN_LINKS).map((link, i) => normalizeFooterLink(link, i, linkUsed, 'link'))
    : [];
  return {
    id: uniqueId(clip(row.id, MAX.id).toLowerCase(), used, `column-${index + 1}`),
    heading: clip(row.heading, MAX.heading),
    hidden: Boolean(row.hidden),
    links,
  };
}

function normalizeContact(raw: unknown, fallback: FooterContact): FooterContact {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const lines = Array.isArray(row.addressLines)
    ? row.addressLines.map((line) => clip(line, MAX.address)).filter(Boolean).slice(0, 6)
    : String(row.addressLines ?? fallback.addressLines.join('\n'))
        .split('\n')
        .map((line) => clip(line, MAX.address))
        .filter(Boolean)
        .slice(0, 6);
  return {
    hidden: Boolean(row.hidden),
    addressLines: lines.length ? lines : fallback.addressLines,
    addressHref: clip(row.addressHref, MAX.href) || fallback.addressHref,
    phoneLabel: clip(row.phoneLabel, MAX.label) || fallback.phoneLabel,
    phoneHref: clip(row.phoneHref, MAX.href) || fallback.phoneHref,
    emailLabel: clip(row.emailLabel, MAX.label) || fallback.emailLabel,
    emailHref: clip(row.emailHref, MAX.href) || fallback.emailHref,
  };
}

function normalizeSocial(raw: unknown, index: number, used: Set<string>): FooterSocial {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const network = isNetwork(row.network) ? row.network : 'instagram';
  return {
    id: uniqueId(clip(row.id, MAX.id).toLowerCase(), used, `social-${index + 1}`),
    network,
    href: clip(row.href, MAX.href),
    label: clip(row.label, MAX.label),
    hidden: Boolean(row.hidden),
  };
}

function everyHref(
  hrefs: Array<{ href: string; label: string }>,
  kind: string,
): string | null {
  for (const row of hrefs) {
    if (!row.label) return `Each ${kind} needs a label.`;
    if (!isAllowedNavHref(row.href)) return `Link is not allowed on ${row.label || kind}.`;
  }
  return null;
}

export function validateSiteNav(input: unknown): { nav: SiteNav; error: string | null } {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : null;
  if (!raw) return { nav: seedSiteNav(), error: 'Nav must be an object.' };

  const headerIn = Array.isArray(raw.header)
    ? raw.header
    : raw.nav && typeof raw.nav === 'object' && Array.isArray((raw.nav as SiteNav).header)
      ? (raw.nav as SiteNav).header
      : null;
  const footerIn =
    raw.footer && typeof raw.footer === 'object'
      ? (raw.footer as Record<string, unknown>)
      : raw.nav && typeof raw.nav === 'object' && (raw.nav as SiteNav).footer
        ? ((raw.nav as SiteNav).footer as unknown as Record<string, unknown>)
        : null;

  if (!headerIn) return { nav: seedSiteNav(), error: 'Header must be an array.' };
  if (!footerIn) return { nav: seedSiteNav(), error: 'Footer is required.' };
  if (headerIn.length < 1) return { nav: seedSiteNav(), error: 'Keep at least one header item.' };
  if (headerIn.length > MAX_HEADER_ITEMS) {
    return { nav: seedSiteNav(), error: `At most ${MAX_HEADER_ITEMS} header items.` };
  }

  const used = new Set<string>();
  const header = headerIn.map((row, i) => normalizeHeaderItem(row, i, used));
  const headerErr = everyHref(header, 'header item');
  if (headerErr) return { nav: seedSiteNav(), error: headerErr };
  for (const itemRow of header) {
    if (itemRow.children.length > MAX_CHILDREN) {
      return { nav: seedSiteNav(), error: `At most ${MAX_CHILDREN} dropdown links on ${itemRow.label}.` };
    }
    const childErr = everyHref(itemRow.children, 'dropdown link');
    if (childErr) return { nav: seedSiteNav(), error: childErr };
  }

  const colIn = Array.isArray(footerIn.columns) ? footerIn.columns : null;
  if (!colIn) return { nav: seedSiteNav(), error: 'Footer columns must be an array.' };
  if (colIn.length < 1) return { nav: seedSiteNav(), error: 'Keep at least one footer column.' };
  if (colIn.length > MAX_COLUMNS) return { nav: seedSiteNav(), error: `At most ${MAX_COLUMNS} footer columns.` };

  const colUsed = new Set<string>();
  const columns = colIn.map((row, i) => normalizeColumn(row, i, colUsed));
  for (const col of columns) {
    if (!col.heading) return { nav: seedSiteNav(), error: 'Each footer column needs a heading.' };
    if (!col.links.length) return { nav: seedSiteNav(), error: `Column ${col.heading} needs at least one link.` };
    const linkErr = everyHref(col.links, 'footer link');
    if (linkErr) return { nav: seedSiteNav(), error: linkErr };
  }

  const contact = normalizeContact(footerIn.contact, seedSiteNav().footer.contact);
  const contactHrefs = [
    { href: contact.addressHref, label: 'Address' },
    { href: contact.phoneHref, label: 'Phone' },
    { href: contact.emailHref, label: 'Email' },
  ];
  const contactErr = everyHref(contactHrefs, 'contact link');
  if (contactErr) return { nav: seedSiteNav(), error: contactErr };
  if (!contact.phoneLabel || !contact.emailLabel || !contact.addressLines.length) {
    return { nav: seedSiteNav(), error: 'Contact needs an address, phone, and email.' };
  }

  const socialIn = Array.isArray(footerIn.socials) ? footerIn.socials : [];
  if (socialIn.length > MAX_SOCIALS) return { nav: seedSiteNav(), error: `At most ${MAX_SOCIALS} social links.` };
  const socialUsed = new Set<string>();
  const socials = socialIn.map((row, i) => normalizeSocial(row, i, socialUsed));
  const socialErr = everyHref(socials, 'social link');
  if (socialErr) return { nav: seedSiteNav(), error: socialErr };

  const ctaRaw = footerIn.cta && typeof footerIn.cta === 'object' ? (footerIn.cta as Record<string, unknown>) : {};
  const cta: FooterCta = {
    hidden: Boolean(ctaRaw.hidden),
    label: clip(ctaRaw.label, MAX.label) || 'GET IN TOUCH',
    href: clip(ctaRaw.href, MAX.href),
  };
  if (!isAllowedNavHref(cta.href)) return { nav: seedSiteNav(), error: 'Get-in-touch link is not allowed.' };

  const legalIn = Array.isArray(footerIn.legal) ? footerIn.legal : [];
  if (legalIn.length > MAX_LEGAL) return { nav: seedSiteNav(), error: `At most ${MAX_LEGAL} legal links.` };
  const legalUsed = new Set<string>();
  const legal = legalIn.map((row, i) => normalizeFooterLink(row, i, legalUsed, 'legal'));
  if (!legal.length) return { nav: seedSiteNav(), error: 'Keep at least one legal link.' };
  const legalErr = everyHref(legal, 'legal link');
  if (legalErr) return { nav: seedSiteNav(), error: legalErr };

  return {
    nav: {
      version: NAV_DOC_VERSION,
      header,
      footer: { columns, contact, socials, cta, legal },
    },
    error: null,
  };
}

function parseNavDoc(raw: unknown): SiteNav | null {
  if (!raw) return null;
  const { nav, error } = validateSiteNav(raw);
  if (error) return null;
  return nav;
}

export function visibleHeaderItems(header: HeaderItem[]): PublicHeaderItem[] {
  return header
    .filter((itemRow) => !itemRow.hidden)
    .map((itemRow) => ({
      id: itemRow.id,
      label: itemRow.label,
      href: itemRow.href,
      align: itemRow.align,
      menu: itemRow.menu,
      matches: itemRow.matches,
      children: itemRow.children.filter((c) => !c.hidden).map(({ hidden: _h, ...rest }) => rest),
    }));
}

export function visibleFooter(footer: SiteNav['footer']): PublicFooter {
  return {
    columns: footer.columns
      .filter((col) => !col.hidden)
      .map((col) => ({
        id: col.id,
        heading: col.heading,
        links: col.links.filter((link) => !link.hidden).map(({ hidden: _h, ...rest }) => rest),
      }))
      .filter((col) => col.links.length),
    contact: footer.contact.hidden ? null : footer.contact,
    socials: footer.socials
      .filter((s) => !s.hidden)
      .map((s) => ({
        ...s,
        src: SOCIAL_ICONS[s.network].src,
        alt: SOCIAL_ICONS[s.network].alt,
      })),
    cta: footer.cta.hidden ? null : { label: footer.cta.label, href: footer.cta.href },
    legal: footer.legal.filter((link) => !link.hidden).map(({ hidden: _h, ...rest }) => rest),
  };
}

export function toPublicNav(nav: SiteNav): PublicSiteNav {
  return {
    header: visibleHeaderItems(nav.header),
    footer: visibleFooter(nav.footer),
  };
}

export function navFingerprint(nav: SiteNav): string {
  const json = JSON.stringify(toPublicNav(nav));
  let hash = 5381;
  for (let i = 0; i < json.length; i += 1) {
    hash = ((hash << 5) + hash) ^ json.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export type NavChildGroup = { label: string; items: PublicNavChild[] };

export function groupedChildren(children: PublicNavChild[]): NavChildGroup[] {
  const groups: NavChildGroup[] = [];
  const index = new Map<string, number>();
  for (const row of children) {
    const label = row.group || '';
    if (!label) {
      groups.push({ label: '', items: [row] });
      continue;
    }
    const existing = index.get(label);
    if (existing === undefined) {
      index.set(label, groups.length);
      groups.push({ label, items: [row] });
    } else {
      groups[existing].items.push(row);
    }
  }
  return groups;
}

const NAV_TTL_MS = 60_000;
const navMem = globalThis as typeof globalThis & {
  __e5SiteNav?: { nav: SiteNav; source: 'redis' | 'seed'; ts: number };
};

export function bustSiteNavCache(): void {
  delete navMem.__e5SiteNav;
}

export async function loadSiteNav(): Promise<{ nav: SiteNav; source: 'redis' | 'seed' }> {
  const cached = navMem.__e5SiteNav;
  if (cached && Date.now() - cached.ts < NAV_TTL_MS) {
    return { nav: cached.nav, source: cached.source };
  }
  const seed = seedSiteNav();
  const redis = portalRedis();
  if (!redis) {
    navMem.__e5SiteNav = { nav: seed, source: 'seed', ts: Date.now() };
    return { nav: seed, source: 'seed' };
  }
  try {
    const raw = await redis.get<unknown>(NAV_REDIS_KEY);
    const parsed = parseNavDoc(raw);
    if (parsed) {
      navMem.__e5SiteNav = { nav: parsed, source: 'redis', ts: Date.now() };
      return { nav: parsed, source: 'redis' };
    }
    await redis.set(NAV_REDIS_KEY, seed, { nx: true });
    const again = parseNavDoc(await redis.get<unknown>(NAV_REDIS_KEY));
    const nav = again || seed;
    const source = again ? 'redis' : 'seed';
    navMem.__e5SiteNav = { nav, source, ts: Date.now() };
    return { nav, source };
  } catch {
    navMem.__e5SiteNav = { nav: seed, source: 'seed', ts: Date.now() };
    return { nav: seed, source: 'seed' };
  }
}

export async function saveSiteNav(input: unknown): Promise<{ nav: SiteNav; error: string | null }> {
  const { nav, error } = validateSiteNav(input);
  if (error) return { nav: seedSiteNav(), error };
  const redis = portalRedis();
  if (!redis) return { nav: seedSiteNav(), error: 'Saving is not available in this environment.' };
  try {
    await redis.set(NAV_REDIS_KEY, nav);
    bustSiteNavCache();
    navMem.__e5SiteNav = { nav, source: 'redis', ts: Date.now() };
    return { nav, error: null };
  } catch {
    return { nav: seedSiteNav(), error: 'Could not save links. Try again.' };
  }
}
