import { API_KEY } from '@/core/constants/App';
import type { WheelApiParams, WheelApiResponse } from '@/core/types/WheelApi';

const API_BASE_URL = 'https://api.autosyncstudio.com/wheels';

/**
 * Builds query parameters for the wheel API request
 */
function buildQueryParams(params: WheelApiParams): URLSearchParams {
  const queryParams = new URLSearchParams();

  // Add API key
  queryParams.append('key', params.key);

  // Add part numbers (comma-separated)
  if (params.partNumbers && params.partNumbers.length > 0) {
    const partNumbersString = params.partNumbers
      .filter(pn => pn && pn.trim() !== '')
      .join(',');
    if (partNumbersString) {
      queryParams.append('f-pns', partNumbersString);
    }
  }

  // Add include flags
  if (params.includeDescription) queryParams.append('i-description', 'true');
  if (params.includeImage) queryParams.append('i-img', 'true');
  if (params.includeImageRotation) queryParams.append('i-imgRotation', 'true');
  if (params.includeInStock) queryParams.append('i-inStock', 'true');
  if (params.includeInventory) queryParams.append('i-inventory', 'true');
  if (params.includePrice) queryParams.append('i-price', 'true');
  if (params.includeSpecs) queryParams.append('i-specs', 'true');
  if (params.includeTags) queryParams.append('i-tags', 'true');

  return queryParams;
}

/**
 * Fetches wheel data from the AutoSync API
 */
export async function fetchWheelData(
  partNumbers: string[],
  options: Partial<WheelApiParams> = {}
): Promise<WheelApiResponse> {
  try {
    // Build params with defaults
    const params: WheelApiParams = {
      key: API_KEY,
      partNumbers,
      includeDescription: options.includeDescription ?? true,
      includeImage: options.includeImage ?? true,
      includeImageRotation: options.includeImageRotation ?? true,
      includeInStock: options.includeInStock ?? true,
      includeInventory: options.includeInventory ?? true,
      includePrice: options.includePrice ?? true,
      includeSpecs: options.includeSpecs ?? true,
      includeTags: options.includeTags ?? true,
    };

    // Build URL with query params
    const queryParams = buildQueryParams(params);
    const url = `${API_BASE_URL}?${queryParams.toString()}`;

    // Make API request
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error fetching wheel data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Fetches wheel data for a specific vehicle from gallery data
 */
export async function fetchWheelDataForVehicle(
  partF: string | null,
  wheelPartR: string | null,
  options: Partial<WheelApiParams> = {}
): Promise<WheelApiResponse> {
  const partNumbers: string[] = [];

  if (partF) partNumbers.push(partF);
  if (wheelPartR) partNumbers.push(wheelPartR);

  if (partNumbers.length === 0) {
    return {
      success: false,
      error: 'No part numbers provided',
    };
  }

  return fetchWheelData(partNumbers, options);
}
