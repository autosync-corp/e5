import {
  formatFitmentSpec,
  getCuratedFitment,
  isWheelExcludedForVehicle,
  wheelMatchesFitmentSpec,
  type FitmentSpec,
  type VehicleFitment,
} from '@/core/constants/CuratedFitments';
import { catalogFinishName } from '@/core/utils/catalogFinish';
import {
  formatRangeOrCall,
  hasRealPrice,
  staggeredSetPrice,
  setPriceFromUnit,
} from '@/core/utils/priceDisplay';
import { modelWordmarkSrc } from '@/core/utils/modelWordmark';
import { buildWheelUrl, toSlug } from '@/core/utils/wheelUrl';

export interface CatalogWheel {
  Model: string;
  Finish?: string | null;
  Color?: string | null;
  Accent?: string | null;
  Diameter: number;
  Width: number;
  Offset: number;
  BoltCircle1: number;
  Price?: number | null;
  Img0001?: string;
  Pn?: string;
}

export interface WheelCatalog {
  ImgUrlBase: string;
  Wheels: CatalogWheel[];
}

export type SeriesFamily = 'FORM FORGED' | '2P FORGED' | 'E5 FORGED' | 'GT FORGED';

const MODEL_FAMILY: Record<string, SeriesFamily> = {
  daytona: 'FORM FORGED',
  sebring: 'FORM FORGED',
  speedway: 'FORM FORGED',
  'sebring-2p': '2P FORGED',
  talladega: 'E5 FORGED',
  sonoma: 'E5 FORGED',
  laguna: 'E5 FORGED',
  gt01: 'GT FORGED',
  gt02: 'GT FORGED',
  gt03: 'GT FORGED',
  gt04: 'GT FORGED',
};

const FAMILY_ORDER: SeriesFamily[] = ['FORM FORGED', '2P FORGED', 'E5 FORGED', 'GT FORGED'];
const MODEL_ORDER = [
  'daytona',
  'sebring',
  'speedway',
  'sebring-2p',
  'talladega',
  'sonoma',
  'laguna',
  'gt01',
  'gt02',
  'gt03',
  'gt04',
];

export const SERIES_FAMILY_LOGO: Record<SeriesFamily, { src: string; alt: string }> = {
  'FORM FORGED': { src: '/assets/images/logos/form-forged.png', alt: 'Form Forged' },
  '2P FORGED': { src: '/assets/images/logos/2p-forged.png', alt: '2P Forged' },
  'E5 FORGED': { src: '/assets/images/logos/e5-forged.webp', alt: 'E5 Forged' },
  'GT FORGED': { src: '/assets/images/logos/gt-forged.png', alt: 'GT Forged' },
};

export interface GenerationSetup {
  model: string;
  finish: string;
  family: SeriesFamily;
  staggered: boolean;
  frontLabel: string;
  rearLabel: string;
  boltPattern: string;
  priceLabel: string;
  shopHref: string;
  exploreHref: string;
  imageSrc: string;
  wordmarkSrc: string | null;
  seriesLogo: { src: string; alt: string };
}

export interface GenerationSetupGroup {
  family: SeriesFamily;
  logo: { src: string; alt: string };
  setups: GenerationSetup[];
}

function familyForModel(model: string): SeriesFamily | null {
  return MODEL_FAMILY[toSlug(model)] ?? null;
}

function modelRank(model: string): number {
  const idx = MODEL_ORDER.indexOf(toSlug(model));
  return idx === -1 ? MODEL_ORDER.length : idx;
}

function wheelMatchesSpec(wheel: CatalogWheel, spec: FitmentSpec): boolean {
  // Same size rule as the /shop vehicle picker: diameter + width.
  // AutoSync BoltCircle1 is often 120.65 even when the PN encodes 5x120,
  // so bolt is not used here. Shop URLs still preselect curated offsets.
  return wheelMatchesFitmentSpec(wheel, spec);
}

function wheelsRouteForModel(model: string): string {
  const slug = toSlug(model);
  const gt = slug.match(/^gt0([1-4])$/);
  if (gt) return `/wheels/gt-0${gt[1]}`;
  return `/wheels/${slug}`;
}

function representativeImage(imgUrlBase: string, wheels: CatalogWheel[]): string {
  const withImage = wheels.find((wheel) => wheel.Img0001);
  if (!withImage?.Img0001) return '';
  return `${imgUrlBase}${withImage.Img0001}`;
}

function setPriceLabel(staggered: boolean, front: CatalogWheel[], rear: CatalogWheel[]): string {
  if (staggered) {
    const frontPrices = front.map((wheel) => wheel.Price).filter(hasRealPrice);
    const rearPrices = rear.map((wheel) => wheel.Price).filter(hasRealPrice);
    if (frontPrices.length === 0 || rearPrices.length === 0) return 'CALL';
    const min = staggeredSetPrice(Math.min(...frontPrices), Math.min(...rearPrices));
    const max = staggeredSetPrice(Math.max(...frontPrices), Math.max(...rearPrices));
    return formatRangeOrCall({ min, max });
  }
  const prices = [...front, ...rear].map((wheel) => wheel.Price).filter(hasRealPrice);
  if (prices.length === 0) return 'CALL';
  return formatRangeOrCall({
    min: setPriceFromUnit(Math.min(...prices)),
    max: setPriceFromUnit(Math.max(...prices)),
  });
}

function optionIsStaggered(option: VehicleFitment): boolean {
  return (
    option.front.diameter !== option.rear.diameter ||
    option.front.width !== option.rear.width ||
    option.front.offset !== option.rear.offset
  );
}

/**
 * Every catalog model+finish that has a complete set for this generation/trim,
 * using curated shop-picker fitments and official CSV prices on the wheels.
 */
export function setupsForVehicle(
  catalog: WheelCatalog,
  generation: string,
  trims: string[]
): GenerationSetup[] {
  const setups: GenerationSetup[] = [];
  const seen = new Set<string>();

  for (const trim of trims) {
    const options = getCuratedFitment(generation, trim);
    if (!options) continue;

    for (const option of options) {
      const staggered = optionIsStaggered(option);
      const byKey = new Map<string, CatalogWheel[]>();
      for (const wheel of catalog.Wheels) {
        const family = familyForModel(wheel.Model);
        if (!family) continue;
        if (isWheelExcludedForVehicle(wheel.Model, generation, trim)) continue;
        const finish = catalogFinishName(wheel);
        const key = `${wheel.Model}::${finish}`;
        const list = byKey.get(key) ?? [];
        list.push(wheel);
        byKey.set(key, list);
      }

      for (const [key, wheels] of byKey) {
        const [model, finish] = key.split('::');
        const family = familyForModel(model);
        if (!family) continue;
        const front = wheels.filter((wheel) => wheelMatchesSpec(wheel, option.front));
        const rear = wheels.filter((wheel) => wheelMatchesSpec(wheel, option.rear));
        if (front.length === 0 || rear.length === 0) continue;

        const id = `${model}|${finish}|${option.front.diameter}x${option.front.width}|${option.rear.diameter}x${option.rear.width}`;
        if (seen.has(id)) continue;
        seen.add(id);

        setups.push({
          model,
          finish,
          family,
          staggered,
          frontLabel: formatFitmentSpec(option.front),
          rearLabel: formatFitmentSpec(option.rear),
          boltPattern: option.front.boltPattern,
          priceLabel: setPriceLabel(staggered, front, rear),
          shopHref: buildWheelUrl(
            model,
            finish,
            generation,
            trim,
            formatFitmentSpec(option.front),
            formatFitmentSpec(option.rear)
          ),
          exploreHref: wheelsRouteForModel(model),
          imageSrc: representativeImage(catalog.ImgUrlBase, [...front, ...rear]),
          wordmarkSrc: modelWordmarkSrc(model),
          seriesLogo: SERIES_FAMILY_LOGO[family],
        });
      }
    }
  }

  return setups.sort((a, b) => {
    const family = FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family);
    if (family !== 0) return family;
    const model = modelRank(a.model) - modelRank(b.model);
    if (model !== 0) return model;
    return a.finish.localeCompare(b.finish);
  });
}

export function groupSetups(setups: GenerationSetup[]): GenerationSetupGroup[] {
  return FAMILY_ORDER.map((family) => ({
    family,
    logo: SERIES_FAMILY_LOGO[family],
    setups: setups.filter((setup) => setup.family === family),
  })).filter((group) => group.setups.length > 0);
}

export function styleLinksFromSetups(setups: GenerationSetup[]): { href: string; label: string }[] {
  const seen = new Set<string>();
  const links: { href: string; label: string }[] = [];
  for (const setup of setups) {
    const key = toSlug(setup.model);
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ href: setup.exploreHref, label: setup.model });
  }
  return links;
}

export function finishSummary(setups: GenerationSetup[]): string {
  const finishes = [...new Set(setups.map((setup) => setup.finish))];
  if (finishes.length === 0) return '';
  const lower = finishes.map((name) => name.toLowerCase());
  return `Available in ${lower.join(', ')}`;
}

