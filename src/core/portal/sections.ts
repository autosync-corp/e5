export type PortalSection = {
  slug: string;
  label: string;
  href: string;
  ready: boolean;
  summary: string;
};

export const PORTAL_SECTIONS: PortalSection[] = [
  {
    slug: 'dashboard',
    label: 'Dashboard',
    href: '/admin',
    ready: true,
    summary: 'Home for the client portal.',
  },
  {
    slug: 'slides',
    label: 'Homepage Slides',
    href: '/admin/slides',
    ready: false,
    summary: 'Edit the homepage film-poster hero slides. Live on save via Upstash.',
  },
  {
    slug: 'links',
    label: 'Header & Footer Links',
    href: '/admin/links',
    ready: false,
    summary: 'Edit header and footer navigation links. Live on save via Upstash.',
  },
  {
    slug: 'blog',
    label: 'Blog Posts',
    href: '/admin/blog',
    ready: false,
    summary: 'Write and publish blog posts. Live on save via Upstash.',
  },
  {
    slug: 'galleries',
    label: 'Galleries',
    href: '/admin/galleries',
    ready: false,
    summary: 'Manage Immersive Gallery sets. Live on save via Upstash.',
  },
  {
    slug: 'performance',
    label: 'Site Performance',
    href: '/admin/performance',
    ready: false,
    summary: 'Read-only PageSpeed / Core Web Vitals snapshot.',
  },
  {
    slug: 'sales',
    label: 'Sales & Prospects',
    href: '/admin/sales',
    ready: false,
    summary: 'GoHighLevel pipeline view for sales and prospects.',
  },
];

export const COMING_SOON_SECTIONS = PORTAL_SECTIONS.filter((s) => !s.ready);
