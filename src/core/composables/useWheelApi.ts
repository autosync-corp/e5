import { ref } from 'vue';
import type { WheelApiRawResponse, WheelData } from '@/core/types/WheelApi';

const API_BASE_URL = 'https://api.autosyncstudio.com/wheels';
const API_KEY = 'efive';

export function useWheelApi() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const wheelData = ref<WheelData[]>([]);
  const imgUrlBase = ref<string>('');
  const rotationImgUrlBase = ref<string>('');

  /**
   * Fetches wheel data from the API
   */
  const fetchWheelData = async (partNumbers: string[]) => {
    if (!partNumbers || partNumbers.length === 0) {
      error.value = 'No part numbers provided';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // Filter out null/empty part numbers
      const validPartNumbers = partNumbers.filter(pn => pn && pn.trim() !== '');

      if (validPartNumbers.length === 0) {
        error.value = 'No valid part numbers provided';
        loading.value = false;
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('key', API_KEY);
      params.append('f-pns', validPartNumbers.join(','));
      params.append('i-description', 'true');
      params.append('i-img', 'true');
      params.append('i-imgRotation', 'true');
      params.append('i-inStock', 'true');
      params.append('i-inventory', 'true');
      params.append('i-price', 'true');
      params.append('i-specs', 'true');
      params.append('i-tags', 'true');

      const url = `${API_BASE_URL}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: WheelApiRawResponse = await response.json();

      wheelData.value = data.Wheels || [];
      imgUrlBase.value = data.ImgUrlBase || '';
      rotationImgUrlBase.value = data.RotationImgUrlBase || '';
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching wheel data:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Gets the full image URL for a wheel
   */
  const getWheelImageUrl = (wheel: WheelData | undefined): string => {
    if (!wheel || !wheel.Img0001 || !imgUrlBase.value) {
      return '/assets/images/form-forged-logo-black.png';
    }
    return imgUrlBase.value + wheel.Img0001;
  };

  return {
    loading,
    error,
    wheelData,
    imgUrlBase,
    rotationImgUrlBase,
    fetchWheelData,
    getWheelImageUrl,
  };
}
