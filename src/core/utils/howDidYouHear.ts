export const HOW_DID_YOU_HEAR_OPTIONS = [
  'Facebook',
  'Instagram',
  'TikTok',
  'Google',
  'Youtube',
  'Friends and Family',
  'Corvette Forums',
  'Trade Shows',
] as const;

export type HowDidYouHearOption = (typeof HOW_DID_YOU_HEAR_OPTIONS)[number] | '';

export function howDidYouHearFromCustomer(customerData: {
  howDidYouHear?: string;
  how_did_you_hear?: string;
} | null | undefined): string {
  const raw = customerData?.howDidYouHear ?? customerData?.how_did_you_hear ?? '';
  return typeof raw === 'string' ? raw.trim() : '';
}

export function applyHowDidYouHear(customerData: {
  orderNotes?: string;
  howDidYouHear?: string;
  how_did_you_hear?: string;
} | null | undefined): { how_did_you_hear: string; orderNotes: string } {
  const how_did_you_hear = howDidYouHearFromCustomer(customerData);
  const notes = (customerData?.orderNotes || '').trim();
  if (!how_did_you_hear) {
    return { how_did_you_hear: '', orderNotes: notes };
  }
  const line = `How did you hear about us?: ${how_did_you_hear}`;
  return {
    how_did_you_hear,
    orderNotes: notes ? `${notes}\n\n${line}` : line,
  };
}
