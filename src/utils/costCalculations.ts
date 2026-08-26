import { Filament, FilamentType } from '../types';
import { highestFilamentRate } from './businessCalculations';

/**
 * Retorna o custo máximo por grama de um tipo de filamento no estoque atual.
 * @deprecated Use `highestFilamentRate` de `businessCalculations.ts`
 */
export const getMaxCostPerGram = (type: string, filaments: Filament[]): number => {
  return highestFilamentRate(filaments, type as FilamentType);
};
