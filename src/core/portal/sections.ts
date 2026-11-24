export type PortalSection = {
  slug: string;
  label: string;
  path: string;
  ready: boolean;
  summary: string;
};

export const PORTAL_SECTIONS: PortalSection[] = [
  {
    slug: 'dashboard',
    label: 'Dashboard',
    path: '/',
    ready: true,
    summary: 'Home for the client portal.',
  },
  {
    slug: 'slides',
    label: 'Homepage Slides',
    path: '/slides',
    ready: true,
    summary: 'Edit the homepage film-poster hero slides. Saved changes appear on the live homepage within about a minute.',
  },
  {
    slug: 'links',
    label: 'Header & Footer Links',
    path: '/links',
    ready: true,
    summary: 'Edit header and footer navigation links. Saved changes appear on the live site within about a minute.',
  },
  {
    slug: 'blog',
    label: 'Blog Posts',
    path: '/blog',
    ready: false,
    summary: 'Write and publish blog posts. Live on save via Upstash.',
  },
  {
    slug: 'galleries',
    label: 'Galleries',
    path: '/galleries',
    ready: false,
    summary: 'Manage Immersive Gallery sets. Live on save via Upstash.',
  },
  {
    slug: 'performance',
    label: 'Site Performance',
    path: '/performance',
    ready: false,
    summary: 'Read-only PageSpeed / Core Web Vitals snapshot.',
  },
  {
    slug: 'sales',
    label: 'Sales & Prospects',
    path: '/sales',
    ready: false,
    summary: 'GoHighLevel pipeline view for sales and prospects.',
  },
];

export const COMING_SOON_SECTIONS = PORTAL_SECTIONS.filter((s) => !s.ready);
