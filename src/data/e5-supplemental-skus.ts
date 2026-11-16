/**
 * Official-CSV part numbers that AutoSync does not yet return.
 * Merged into fetchWheels by cloning the same model + finish sibling.
 *
 * Sizes are encoded in the PN (see decodeE5Pn). Do not invent staggered
 * pairs here — each row is one wheel, sold as a complete set of 4 like
 * every other catalog SKU. Front/rear pairing happens only when a
 * staggered vehicle is selected, using the same fitment rules as siblings.
 */
export const SUPPLEMENTAL_PNS = [
  'E5DA2012E45565BBT',
  'E5DA2090E38520BBT',
  'E5DA1910E50565BK',
  'E5DA2011E73565BK',
  'E5DA2090E38520BK',
  'E5DA1910E50565TIU',
  'E5DA2011E73565TIU',
  'E5DA2090E38520TIU',
  'E5SE2012E45565BBT',
  'E5SE2090E38520BBT',
  'E5SE1985E30520BK',
  'E5SE1990E50565BK',
  'E5SE2011E73565BK',
  'E5SE2012E45565BK',
  'E5SE2090E38520BK',
  'E5SE1990E50565TIU',
  'E5SE2011E73565TIU',
  'E5SE2012E45565TIU',
  'E5SE2090E38520TIU',
  'E5TA2010E25520PO',
  'E5TA2113E20520PO',
  'E5TA2010E25520SB',
  'E5TA2113E20520SB',
] as const;

export const MODEL_CODE_TO_NAME: Record<string, string> = {
  DA: 'Daytona',
  SE: 'Sebring',
  TA: 'Talladega',
  LA: 'Laguna',
  SO: 'Sonoma',
  SP: 'Speedway',
};

export const FINISH_FIELD_DEFAULTS: Record<
  string,
  {
    Finish: string | null;
    Color: string | null;
    Accent: string | null;
    ShortFinish: string | null;
    ShortColor: string | null;
  }
> = {
  BBT: {
    Finish: null,
    Color: 'Bronze',
    Accent: 'Brushed Tint',
    ShortFinish: null,
    ShortColor: 'Bronze',
  },
  BK: {
    Finish: 'Gloss',
    Color: 'Black',
    Accent: null,
    ShortFinish: 'Gloss',
    ShortColor: 'Black',
  },
  TIU: {
    Finish: null,
    Color: 'Titanium',
    Accent: 'Brushed',
    ShortFinish: null,
    ShortColor: 'Titanium',
  },
  PO: {
    Finish: 'Polished',
    Color: null,
    Accent: null,
    ShortFinish: 'Polished',
    ShortColor: null,
  },
  SB: {
    Finish: 'Satin',
    Color: 'Black',
    Accent: null,
    ShortFinish: 'Satin',
    ShortColor: 'Black',
  },
  AB: {
    Finish: 'Brushed',
    Color: 'Aluminum',
    Accent: null,
    ShortFinish: 'Brushed',
    ShortColor: 'Silver',
  },
};
