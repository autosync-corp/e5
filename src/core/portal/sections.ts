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
    ready: true,
    summary: 'Write and publish blog posts. Saved changes appear on the live blog within about a minute.',
  },
  {
    slug: 'galleries',
    label: 'Galleries',
    path: '/galleries',
    ready: true,
    summary: 'Show, hide, and reorder vehicle galleries. Saved changes appear on the live gallery within about a minute.',
  },
  {
    slug: 'performance',
    label: 'Site Performance',
    path: '/performance',
    ready: true,
    summary: 'Lab test scores for the homepage, compared with November 1. Snapshot files, updated by a small PR.',
  },
  {
    slug: 'sales',
    label: 'Sales & Prospects',
    path: '/sales',
    ready: true,
    summary: 'New prospects, pipelines, and lead sources. View only.',
  },
];

export const COMING_SOON_SECTIONS = PORTAL_SECTIONS.filter((s) => !s.ready);
