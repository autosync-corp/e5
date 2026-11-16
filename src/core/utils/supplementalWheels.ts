/**
 * Expand official-CSV PNs that AutoSync omits into WheelProduct rows
 * by cloning an existing sibling of the same model (and finish when one exists).
 */
import {
  FINISH_FIELD_DEFAULTS,
  MODEL_CODE_TO_NAME,
  SUPPLEMENTAL_PNS,
} from '@/data/e5-supplemental-skus';
import { finishCodeFromPn, officialPriceForPn } from '@/core/utils/officialPricing';
import type { WheelProduct } from '@/core/services/ProductService';

export interface DecodedE5Pn {
  modelCode: string;
  model: string;
  diameter: number;
  width: number;
  offset: number;
  boltCode: string;
  finishCode: string;
}

const BOLT_CODE_TO_CIRCLE: Record<string, number> = {
  '520': 120,
  '565': 120.65,
};

/** When a finish has no photo yet, reuse the closest existing sibling. */
const FINISH_IMAGE_FALLBACK: Record<string, string[]> = {
  PO: ['AB'],
  SB: ['BK', 'AB'],
};

export function decodeE5Pn(pn: string): DecodedE5Pn | null {
  const match = pn.trim().match(/^E5(DA|SE|TA|LA|SO|SP)(\d{2})(\d{2})E(\d{2,3})(\d{3})([A-Z]{2,4})$/i);
  if (!match) return null;
  const modelCode = match[1].toUpperCase();
  const widthRaw = Number(match[3]);
  return {
    modelCode,
    model: MODEL_CODE_TO_NAME[modelCode] || modelCode,
    diameter: Number(match[2]),
    width: widthRaw >= 80 ? widthRaw / 10 : widthRaw,
    offset: Number(match[4]),
    boltCode: match[5],
    finishCode: match[6].toUpperCase(),
  };
}

function finishCodeOf(wheel: WheelProduct): string | null {
  return finishCodeFromPn(wheel.Pn) || wheel.Submodel || null;
}

function pickSibling(wheels: WheelProduct[], decoded: DecodedE5Pn): WheelProduct | undefined {
  const sameModel = wheels.filter((wheel) => wheel.Model === decoded.model);
  const boltCircle = BOLT_CODE_TO_CIRCLE[decoded.boltCode];
  return (
    sameModel.find((wheel) => finishCodeOf(wheel) === decoded.finishCode) ||
    sameModel.find(
      (wheel) =>
        wheel.Diameter === decoded.diameter &&
        wheel.Width === decoded.width &&
        (boltCircle == null || wheel.BoltCircle1 === boltCircle)
    ) ||
    sameModel.find((wheel) => wheel.Diameter === decoded.diameter && wheel.Width === decoded.width) ||
    sameModel[0]
  );
}

function syntheticId(_pn: string, index: number): number {
  return 9_000_001 + index;
}

export function buildSupplementalWheel(
  pn: string,
  catalog: WheelProduct[],
  index = 0
): WheelProduct | null {
  const decoded = decodeE5Pn(pn);
  if (!decoded) return null;
  const sibling = pickSibling(catalog, decoded);
  if (!sibling) return null;

  const finishDefaults = FINISH_FIELD_DEFAULTS[decoded.finishCode];
  const unitPrice = officialPriceForPn(pn) ?? sibling.Price;
  const sameModel = catalog.filter((wheel) => wheel.Model === decoded.model);
  const sameFinishSibling = sameModel.find((wheel) => finishCodeOf(wheel) === decoded.finishCode);
  const finishDonor = sameFinishSibling || finishDefaults;
  const imageDonor =
    sameFinishSibling ||
    (FINISH_IMAGE_FALLBACK[decoded.finishCode] || [])
      .map((code) => sameModel.find((wheel) => finishCodeOf(wheel) === code))
      .find(Boolean) ||
    sibling;
  const boltCircle = BOLT_CODE_TO_CIRCLE[decoded.boltCode];

  return {
    ...sibling,
    Id: syntheticId(pn, index),
    Pn: pn,
    Diameter: decoded.diameter,
    Width: decoded.width,
    Offset: decoded.offset,
    BoltCircle1: boltCircle ?? sibling.BoltCircle1,
    Submodel: decoded.finishCode,
    Price: unitPrice ?? null,
    Inventory: 100,
    InStock: true,
    Gtin: null,
    Upc: sibling.Upc,
    Finish: finishDonor?.Finish ?? sibling.Finish,
    Color: sameFinishSibling
      ? sameFinishSibling.Color
      : finishDefaults
        ? (finishDefaults.Color ?? '')
        : sibling.Color,
    Accent: sameFinishSibling
      ? sameFinishSibling.Accent
      : finishDefaults
        ? finishDefaults.Accent
        : sibling.Accent,
    ShortFinish: sameFinishSibling
      ? sameFinishSibling.ShortFinish
      : finishDefaults
        ? finishDefaults.ShortFinish
        : sibling.ShortFinish,
    ShortColor: sameFinishSibling
      ? sameFinishSibling.ShortColor
      : finishDefaults
        ? (finishDefaults.ShortColor ?? '')
        : sibling.ShortColor,
    Img0001: imageDonor.Img0001 || sibling.Img0001,
    Img0002: imageDonor.Img0002 || sibling.Img0002,
    Img0003: imageDonor.Img0003 || sibling.Img0003,
  };
}

export function mergeSupplementalWheels(wheels: WheelProduct[]): WheelProduct[] {
  const have = new Set(wheels.map((wheel) => wheel.Pn));
  const extra: WheelProduct[] = [];
  SUPPLEMENTAL_PNS.forEach((pn, index) => {
    if (have.has(pn)) return;
    const built = buildSupplementalWheel(pn, wheels, index);
    if (built) {
      extra.push(built);
      have.add(pn);
    }
  });
  return extra.length > 0 ? [...wheels, ...extra] : wheels;
}
