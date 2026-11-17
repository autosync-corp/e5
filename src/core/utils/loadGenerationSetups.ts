import { fetchWheels } from '@/core/services/ProductService';
import { setupsForVehicle, type GenerationSetup } from '@/core/utils/generationSetups';

export async function loadGenerationSetups(
  generation: string,
  trims: string[]
): Promise<GenerationSetup[]> {
  try {
    const catalog = await fetchWheels();
    return setupsForVehicle(catalog, generation, trims);
  } catch (error) {
    console.warn(`Generation setups unavailable for ${generation} ${trims.join('/')}`, error);
    return [];
  }
}
