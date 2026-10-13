/**
 * Shared anti-spam checks for the public forms (contact, vendor registration,
 * wheel registration, RSVP).
 *
 * These deliberately run SERVER-SIDE. Every /api/send-*-webhook route is a public
 * endpoint, so a bot can POST JSON straight at it without ever loading the form -
 * anything enforced only in the browser stops nothing.
 *
 * Extracted from rsvp.ts, which was the only form that had any protection.
 */

const RECAPTCHA_SCORE_THRESHOLD = 0.7;
const NOMINATIM_USER_AGENT = 'E5Wheels-Forms/1.0 (https://e5wheels.com)';
const NOMINATIM_TIMEOUT_MS = 5000;

/**
 * reCAPTCHA Enterprise. Returns true if the submission should proceed.
 *
 * Skips the check entirely when the feature isn't configured (matching the
 * optional-webhook pattern used elsewhere), but logs loudly when it does - a
 * silently disabled captcha looks identical to a working one.
 *
 * Blocks once keys are set and the token is missing, invalid, for the wrong
 * action, or scores below the threshold.
 */
export async function verifyRecaptcha(token: string, expectedAction: string): Promise<boolean> {
  const projectId = import.meta.env.RECAPTCHA_PROJECT_ID;
  const apiKey = import.meta.env.RECAPTCHA_API_KEY;
  const siteKey = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY;

  if (!projectId || !apiKey || !siteKey) {
    console.error(
      `[forms] reCAPTCHA IS NOT CONFIGURED - "${expectedAction}" allowed through unchecked. ` +
      `Set RECAPTCHA_PROJECT_ID, RECAPTCHA_API_KEY and PUBLIC_RECAPTCHA_SITE_KEY to enable it.`
    );
    return true;
  }
  if (!token) return false;

  try {
    const res = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: { token, expectedAction, siteKey } }),
      }
    );
    const result = await res.json();
    if (!result.tokenProperties?.valid) return false;
    if (result.tokenProperties.action !== expectedAction) return false;
    return (result.riskAnalysis?.score ?? 0) >= RECAPTCHA_SCORE_THRESHOLD;
  } catch {
    return false;
  }
}

/**
 * Verifies the submitted city genuinely exists in the given state via OpenStreetMap's
 * free Nominatim geocoder. Fails OPEN (allows the submission) on network/timeout/service
 * errors - this is a community-run service with no SLA, an outage there should never
 * block a real customer. Only fails CLOSED when Nominatim returns zero matches, meaning
 * the city/state pair doesn't resolve to any real place.
 */
export async function verifyCity(city: string, state: string): Promise<boolean> {
  if (!city || !state) return true;

  try {
    const params = new URLSearchParams({
      city,
      state,
      country: 'USA',
      format: 'json',
      limit: '1',
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return true;
    const results = await res.json();
    return Array.isArray(results) && results.length > 0;
  } catch {
    return true;
  }
}

const US_STATES: Record<string, string> = {
  AL:'alabama', AK:'alaska', AZ:'arizona', AR:'arkansas', CA:'california', CO:'colorado',
  CT:'connecticut', DE:'delaware', FL:'florida', GA:'georgia', HI:'hawaii', ID:'idaho',
  IL:'illinois', IN:'indiana', IA:'iowa', KS:'kansas', KY:'kentucky', LA:'louisiana',
  ME:'maine', MD:'maryland', MA:'massachusetts', MI:'michigan', MN:'minnesota',
  MS:'mississippi', MO:'missouri', MT:'montana', NE:'nebraska', NV:'nevada',
  NH:'new hampshire', NJ:'new jersey', NM:'new mexico', NY:'new york',
  NC:'north carolina', ND:'north dakota', OH:'ohio', OK:'oklahoma', OR:'oregon',
  PA:'pennsylvania', RI:'rhode island', SC:'south carolina', SD:'south dakota',
  TN:'tennessee', TX:'texas', UT:'utah', VT:'vermont', VA:'virginia', WA:'washington',
  WV:'west virginia', WI:'wisconsin', WY:'wyoming', DC:'district of columbia',
  PR:'puerto rico', VI:'united states virgin islands', GU:'guam', AS:'american samoa',
  MP:'northern mariana islands',
};

/** Accepts either a 2-letter code ("TX") or a full name ("Texas"). */
function normalizeState(state: string): string | null {
  const raw = (state || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.length === 2 && US_STATES[raw.toUpperCase()]) return US_STATES[raw.toUpperCase()];
  return Object.values(US_STATES).includes(raw) ? raw : null;
}

/**
 * Verifies a US ZIP actually belongs to the given state - the spam that prompted this
 * paired state "AL" with ZIP 77485, which is Texas.
 *
 * Fails OPEN aggressively: unknown state, unparseable ZIP, no Nominatim result, no state
 * in the response, or any error all allow the submission. US postcode coverage in OSM is
 * incomplete, and wrongly rejecting a real dealer is far worse than letting spam through
 * here - the city check and reCAPTCHA are the primary defences. Only fails CLOSED when
 * Nominatim confidently resolves the ZIP to a DIFFERENT state.
 */
export async function verifyZipMatchesState(zipCode: string, state: string): Promise<boolean> {
  const expected = normalizeState(state);
  const zip = (zipCode || '').trim().match(/^\d{5}/)?.[0];
  if (!expected || !zip) return true;

  try {
    const params = new URLSearchParams({
      postalcode: zip,
      country: 'USA',
      format: 'json',
      addressdetails: '1',
      limit: '1',
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return true;
    const results = await res.json();
    const found = Array.isArray(results) && results[0]?.address?.state;
    if (!found) return true;
    return String(found).trim().toLowerCase() === expected;
  } catch {
    return true;
  }
}

/**
 * Honeypot: a field hidden from real users that bots fill in because it's in the DOM.
 * Any non-empty value means a bot. Costs nothing and needs no third-party service.
 */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}
