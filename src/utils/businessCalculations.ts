import { BOMItem, BudgetItem, EnergyTariff, Filament, FilamentType, Product } from '../types';

export function activeEnergyRate(tariffs: EnergyTariff[], fallback = 0.85) {
  return [...tariffs].sort((a, b) => b.dataInicio.localeCompare(a.dataInicio))[0]?.valorKwh ?? fallback;
}

export function highestFilamentRate(filaments: Filament[], type: FilamentType, fallback = 0.12) {
  const rates = filaments.filter((filament) => filament.tipo === type && filament.pesoTotal > 0)
    .map((filament) => filament.valorCompra / filament.pesoTotal);
  return rates.length ? Math.max(...rates) : fallback;
}

export function bomCost(materials: BOMItem[] | undefined, filaments: Filament[]) {
  return (materials || []).reduce((total, material) => total + material.quantidadeGrams * highestFilamentRate(filaments, material.tipoFilamento), 0);
}

export function suggestedProductPrice(product: Product, filaments: Filament[], energyRate = 0.85) {
  if (product.precoVenda > 0) return product.precoVenda;
  const material = bomCost(product.materials, filaments);
  const energy = (350 * product.tempoImpressao / 1000) * energyRate;
  const markup = 1 + ((product.margemLucro ?? 100) + (product.overPercent ?? 0)) / 100;
  return Number(((material + energy + product.valorMaoDeObra + (product.outrasDespesas || 0)) * markup).toFixed(2));
}

export function budgetSubtotal(items: BudgetItem[]) {
  return items.reduce((total, item) => total + item.quantidade * Math.max(0, item.valorUnitario - item.desconto), 0);
}

export function budgetTotal(items: BudgetItem[], discount = 0) {
  return Math.max(0, budgetSubtotal(items) - discount);
}
