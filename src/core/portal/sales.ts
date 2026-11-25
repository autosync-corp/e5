import { portalRedis } from '@/core/portal/slides.ts';
import { HOW_DID_YOU_HEAR_OPTIONS } from '@/core/utils/howDidYouHear.ts';

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_TTL_SEC = 300;
const PAGE_LIMIT = 100;
const MAX_PAGES = 50;
const RECENT_LIMIT = 25;
const REDIS_PREFIX = 'e5:portal:sales:v1:';
const DISPLAY_TZ = 'America/New_York';

export const SALES_RANGES = [7, 30, 90] as const;
export type SalesRangeDays = (typeof SALES_RANGES)[number];

export type SalesCount = { label: string; count: number };
export type SalesStage = { name: string; count: number; value: number };
export type SalesPipeline = { name: string; stages: SalesStage[]; count: number; value: number };
export type SalesProspect = {
  name: string;
  added: string;
  source: string;
  tags: string[];
  stage: string;
};
export type SalesSnapshot = {
  days: SalesRangeDays;
  from: string;
  to: string;
  summary: {
    newContacts: number;
    openCount: number;
    openValue: number;
    wonCount: number;
    wonValue: number;
    lostCount: number;
    winRate: number | null;
  };
  pipelines: SalesPipeline[];
  prospects: SalesProspect[];
  sources: SalesCount[];
  hearAbout: SalesCount[] | null;
};

type GhlPipeline = { id?: string; name?: string; stages?: GhlStage[] };
type GhlStage = { id?: string; name?: string; position?: number };
type GhlCustomField = { id?: string; name?: string; fieldKey?: string };
type GhlOpportunity = {
  id?: string;
  monetaryValue?: number;
  pipelineId?: string;
  pipelineStageId?: string;
  status?: string;
  createdAt?: string;
  contactId?: string;
  contact?: { id?: string; name?: string };
};
type GhlContact = {
  id?: string;
  firstName?: string;
  lastName?: string;
  contactName?: string;
  dateAdded?: string;
  source?: string | null;
  tags?: string[];
  customFields?: { id?: string; value?: unknown }[];
  opportunities?: { pipelineId?: string; pipelineStageId?: string; status?: string }[];
  searchAfter?: unknown[];
};

type MemoryEntry = { expires: number; snapshot: SalesSnapshot };

const memory = (() => {
  const g = globalThis as typeof globalThis & { __e5PortalSales?: Map<string, MemoryEntry> };
  if (!g.__e5PortalSales) g.__e5PortalSales = new Map();
  return g.__e5PortalSales;
})();

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  return fromMeta || '';
}

export function parseSalesRange(raw: string | null | undefined): SalesRangeDays {
  const n = Number(raw);
  if (n === 7 || n === 90) return n;
  return 30;
}

export function formatMoney(value: number): string {
  const cents = Math.round((Number(value) || 0) * 100) / 100;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents);
}

export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: DISPLAY_TZ,
  }).format(date);
}

export function formatWinRate(rate: number | null): string {
  if (rate == null) return '—';
  return `${Math.round(rate * 1000) / 10}%`;
}

export class SalesLoadError extends Error {
  constructor() {
    super('sales-load-failed');
    this.name = 'SalesLoadError';
  }
}

function cacheKey(days: SalesRangeDays): string {
  return `${REDIS_PREFIX}${days}`;
}

function money(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function mmDdYyyy(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const month = parts.find((p) => p.type === 'month')?.value || '01';
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  const year = parts.find((p) => p.type === 'year')?.value || '1970';
  return `${month}-${day}-${year}`;
}

function displayName(contact: GhlContact): string {
  const first = String(contact.firstName || '').trim();
  const last = String(contact.lastName || '').trim();
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  const fallback = String(contact.contactName || '').trim();
  return fallback || 'No name';
}

function labelOrUnset(value: unknown): string {
  const text = String(value || '').trim();
  return text || 'Not set';
}

function hearAboutName(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes('hear about') || n.includes('how did you hear') || n.includes('how_did_you_hear');
}

function isHearAboutTag(tag: string): boolean {
  const needle = tag.trim().toLowerCase();
  if (!needle) return false;
  if (hearAboutName(needle)) return true;
  return HOW_DID_YOU_HEAR_OPTIONS.some((option) => option.toLowerCase() === needle);
}

function countLabels(values: string[]): SalesCount[] {
  const tally = new Map<string, number>();
  for (const value of values) {
    const label = labelOrUnset(value);
    tally.set(label, (tally.get(label) || 0) + 1);
  }
  return [...tally.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function isSnapshot(raw: unknown): raw is SalesSnapshot {
  if (!raw || typeof raw !== 'object') return false;
  const data = raw as SalesSnapshot;
  return (
    (data.days === 7 || data.days === 30 || data.days === 90) &&
    typeof data.summary?.newContacts === 'number' &&
    Array.isArray(data.pipelines) &&
    Array.isArray(data.prospects) &&
    Array.isArray(data.sources)
  );
}

async function ghlRequest(path: string, init?: RequestInit): Promise<unknown> {
  const token = env('GHL_PRIVATE_TOKEN');
  const locationId = env('GHL_LOCATION_ID');
  if (!token || !locationId) throw new SalesLoadError();

  const url = path.startsWith('http') ? new URL(path) : new URL(path, GHL_BASE);
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Version', GHL_VERSION);
  headers.set('Accept', 'application/json');
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, cache: 'no-store', signal: AbortSignal.timeout(25000) });
  } catch {
    throw new SalesLoadError();
  }
  if (!res.ok) throw new SalesLoadError();
  try {
    return await res.json();
  } catch {
    throw new SalesLoadError();
  }
}

async function listPipelines(locationId: string): Promise<GhlPipeline[]> {
  const data = (await ghlRequest(`/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`)) as {
    pipelines?: GhlPipeline[];
  };
  return Array.isArray(data.pipelines) ? data.pipelines : [];
}

async function listCustomFields(locationId: string): Promise<GhlCustomField[]> {
  try {
    const data = (await ghlRequest(
      `/locations/${encodeURIComponent(locationId)}/customFields?model=contact`,
    )) as { customFields?: GhlCustomField[] };
    return Array.isArray(data.customFields) ? data.customFields : [];
  } catch {
    return [];
  }
}

async function listOpportunities(locationId: string, start: Date, end: Date): Promise<GhlOpportunity[]> {
  const all: GhlOpportunity[] = [];
  let startAfter = '';
  let startAfterId = '';
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      location_id: locationId,
      locationId,
      limit: String(PAGE_LIMIT),
      status: 'all',
      order: 'added_desc',
      date: mmDdYyyy(start),
      endDate: mmDdYyyy(end),
    });
    if (startAfter) params.set('startAfter', startAfter);
    if (startAfterId) params.set('startAfterId', startAfterId);
    const data = (await ghlRequest(`/opportunities/search?${params}`)) as {
      opportunities?: GhlOpportunity[];
      meta?: { startAfter?: number | string; startAfterId?: string; total?: number };
    };
    const batch = Array.isArray(data.opportunities) ? data.opportunities : [];
    all.push(...batch);
    if (batch.length < PAGE_LIMIT) break;
    const last = batch[batch.length - 1];
    startAfter = String(data.meta?.startAfter || Date.parse(last?.createdAt || '') || '');
    startAfterId = String(data.meta?.startAfterId || last?.id || '');
    if (!startAfter || !startAfterId) break;
    if (typeof data.meta?.total === 'number' && all.length >= data.meta.total) break;
  }
  return all;
}

function inRange(iso: string | undefined, start: Date, end: Date): boolean {
  if (!iso) return false;
  const at = Date.parse(iso);
  return Number.isFinite(at) && at >= start.getTime() && at <= end.getTime();
}

async function searchContacts(locationId: string, start: Date, end: Date): Promise<GhlContact[]> {
  const all: GhlContact[] = [];
  let searchAfter: unknown[] | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const body: Record<string, unknown> = {
      locationId,
      pageLimit: PAGE_LIMIT,
      sort: [{ field: 'dateAdded', direction: 'desc' }],
      filters: [
        {
          field: 'dateAdded',
          operator: 'range',
          value: { gte: start.toISOString(), lte: end.toISOString() },
        },
      ],
    };
    if (searchAfter) body.searchAfter = searchAfter;
    const data = (await ghlRequest('/contacts/search', {
      method: 'POST',
      body: JSON.stringify(body),
    })) as { contacts?: GhlContact[]; total?: number };
    const batch = Array.isArray(data.contacts) ? data.contacts : [];
    all.push(...batch);
    if (batch.length < PAGE_LIMIT) break;
    const last = batch[batch.length - 1];
    searchAfter = Array.isArray(last?.searchAfter) ? last.searchAfter : undefined;
    if (!searchAfter) break;
    if (typeof data.total === 'number' && all.length >= data.total) break;
  }
  return all;
}

async function listContactsGet(locationId: string, start: Date, end: Date): Promise<GhlContact[]> {
  const all: GhlContact[] = [];
  let startAfterId = '';
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      locationId,
      limit: String(PAGE_LIMIT),
    });
    if (startAfterId) params.set('startAfterId', startAfterId);
    const data = (await ghlRequest(`/contacts/?${params}`)) as {
      contacts?: GhlContact[];
      meta?: { total?: number };
    };
    const batch = Array.isArray(data.contacts) ? data.contacts : [];
    all.push(...batch);
    if (batch.length < PAGE_LIMIT) break;
    const last = batch[batch.length - 1];
    if (!last?.id || last.id === startAfterId) break;
    startAfterId = last.id;
    if (typeof data.meta?.total === 'number' && all.length >= data.meta.total) break;
  }
  return all
    .filter((contact) => inRange(contact.dateAdded, start, end))
    .sort((a, b) => Date.parse(b.dateAdded || '') - Date.parse(a.dateAdded || ''));
}

async function listContacts(locationId: string, start: Date, end: Date): Promise<GhlContact[]> {
  try {
    return await searchContacts(locationId, start, end);
  } catch {
    return listContactsGet(locationId, start, end);
  }
}

function buildSnapshot(
  days: SalesRangeDays,
  start: Date,
  end: Date,
  pipelines: GhlPipeline[],
  fields: GhlCustomField[],
  contacts: GhlContact[],
  opportunities: GhlOpportunity[],
): SalesSnapshot {
  const stageName = new Map<string, { pipeline: string; stage: string }>();
  for (const pipeline of pipelines) {
    const pipelineName = String(pipeline.name || '').trim() || 'Untitled pipeline';
    for (const stage of pipeline.stages || []) {
      if (!stage.id) continue;
      stageName.set(stage.id, {
        pipeline: pipelineName,
        stage: String(stage.name || '').trim() || 'Untitled stage',
      });
    }
  }

  const open = opportunities.filter((item) => item.status === 'open');
  const won = opportunities.filter((item) => item.status === 'won');
  const lost = opportunities.filter((item) => item.status === 'lost');
  const closed = won.length + lost.length;

  const pipelineRows: SalesPipeline[] = pipelines.map((pipeline) => {
    const stages = [...(pipeline.stages || [])]
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((stage) => {
        const items = opportunities.filter(
          (item) => item.pipelineId === pipeline.id && item.pipelineStageId === stage.id,
        );
        return {
          name: String(stage.name || '').trim() || 'Untitled stage',
          count: items.length,
          value: items.reduce((sum, item) => sum + money(item.monetaryValue), 0),
        };
      });
    return {
      name: String(pipeline.name || '').trim() || 'Untitled pipeline',
      stages,
      count: stages.reduce((sum, stage) => sum + stage.count, 0),
      value: stages.reduce((sum, stage) => sum + stage.value, 0),
    };
  });

  const hearFieldIds = new Set(
    fields.filter((field) => hearAboutName(`${field.name || ''} ${field.fieldKey || ''}`)).map((field) => field.id || ''),
  );
  hearFieldIds.delete('');

  const hearValues: string[] = [];
  for (const contact of contacts) {
    for (const tag of contact.tags || []) {
      if (isHearAboutTag(String(tag || ''))) hearValues.push(String(tag).trim());
    }
    for (const field of contact.customFields || []) {
      if (!field.id || !hearFieldIds.has(field.id)) continue;
      const value = Array.isArray(field.value) ? field.value.join(', ') : String(field.value ?? '').trim();
      if (value) hearValues.push(value);
    }
  }

  const prospects: SalesProspect[] = contacts.slice(0, RECENT_LIMIT).map((contact) => {
    const linked = [...(contact.opportunities || [])].sort((a, b) => {
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (b.status === 'open' && a.status !== 'open') return 1;
      return 0;
    })[0];
    const named = linked?.pipelineStageId ? stageName.get(linked.pipelineStageId) : undefined;
    return {
      name: displayName(contact),
      added: contact.dateAdded || '',
      source: labelOrUnset(contact.source),
      tags: (contact.tags || []).map((tag) => String(tag || '').trim()).filter(Boolean),
      stage: named ? `${named.pipeline} · ${named.stage}` : '',
    };
  });

  return {
    days,
    from: start.toISOString(),
    to: end.toISOString(),
    summary: {
      newContacts: contacts.length,
      openCount: open.length,
      openValue: open.reduce((sum, item) => sum + money(item.monetaryValue), 0),
      wonCount: won.length,
      wonValue: won.reduce((sum, item) => sum + money(item.monetaryValue), 0),
      lostCount: lost.length,
      winRate: closed ? won.length / closed : null,
    },
    pipelines: pipelineRows,
    prospects,
    sources: countLabels(contacts.map((contact) => String(contact.source || '').trim())),
    hearAbout: hearValues.length ? countLabels(hearValues) : null,
  };
}

async function readCache(days: SalesRangeDays): Promise<SalesSnapshot | null> {
  const mem = memory.get(cacheKey(days));
  if (mem && mem.expires > Date.now() && isSnapshot(mem.snapshot)) return mem.snapshot;
  const redis = portalRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<unknown>(cacheKey(days));
    if (!isSnapshot(raw)) return null;
    memory.set(cacheKey(days), { expires: Date.now() + CACHE_TTL_MS, snapshot: raw });
    return raw;
  } catch {
    return null;
  }
}

async function writeCache(days: SalesRangeDays, snapshot: SalesSnapshot): Promise<void> {
  memory.set(cacheKey(days), { expires: Date.now() + CACHE_TTL_MS, snapshot });
  const redis = portalRedis();
  if (!redis) return;
  try {
    await redis.set(cacheKey(days), snapshot, { ex: CACHE_TTL_SEC });
  } catch {
    /* memory cache still holds it */
  }
}

async function fetchSnapshot(days: SalesRangeDays): Promise<SalesSnapshot> {
  const locationId = env('GHL_LOCATION_ID');
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const pipelines = await listPipelines(locationId);
  const fields = await listCustomFields(locationId);
  const contacts = await listContacts(locationId, start, end);
  const opportunities = await listOpportunities(locationId, start, end);
  return buildSnapshot(days, start, end, pipelines, fields, contacts, opportunities);
}

export async function loadSalesSnapshot(days: SalesRangeDays): Promise<SalesSnapshot> {
  const cached = await readCache(days);
  if (cached) return cached;
  const snapshot = await fetchSnapshot(days);
  await writeCache(days, snapshot);
  return snapshot;
}
