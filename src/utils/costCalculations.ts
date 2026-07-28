import { Filament } from '../types';

/**
 * Retorna o custo máximo por grama de um tipo de filamento no estoque atual.
 * Usa o pior caso (maior preço) para cálculo conservador de custos de produção.
 * Corrige divisão por zero quando pesoTotal = 0.
 */
export const getMaxCostPerGram = (type: string, filaments: Filament[]): number => {
  const typeFilaments = filaments.filter(f => f.tipo === type);
  if (typeFilaments.length === 0) return 0.12; // fallback médio de mercado
  let max = 0;
  typeFilaments.forEach(f => {
    const rate = f.pesoTotal > 0 ? f.valorCompra / f.pesoTotal : 0;
    if (rate > max) max = rate;
  });
  return max;
};
