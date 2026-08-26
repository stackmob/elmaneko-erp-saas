import { BOMItem, BudgetItem, EnergyTariff, Filament, FilamentType, GlobalPricingConfig, Printer, Product } from '../types';

export const DEFAULT_GLOBAL_PRICING_CONFIG: GlobalPricingConfig = {
  margemLucroPadrao: 100,
  outrasDespesasPadrao: 0,
  valorMaoDeObraPadrao: 30.00
};

export function getGlobalPricingConfig(empresaId?: string): GlobalPricingConfig {
  try {
    const empId = empresaId || (typeof localStorage !== 'undefined' ? localStorage.getItem('elmaneko_empresa_id') : null) || 'no_tenant';
    const key = `elmaneko_cache_${empId}_global_pricing_config`;
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        margemLucroPadrao: Math.max(0, Number(parsed.margemLucroPadrao ?? 100)),
        outrasDespesasPadrao: Math.max(0, Number(parsed.outrasDespesasPadrao ?? 0)),
        valorMaoDeObraPadrao: Math.max(0, Number(parsed.valorMaoDeObraPadrao ?? 30)),
      };
    }
  } catch (e) {}
  return DEFAULT_GLOBAL_PRICING_CONFIG;
}

export function saveGlobalPricingConfig(config: GlobalPricingConfig, empresaId?: string): void {
  try {
    const empId = empresaId || (typeof localStorage !== 'undefined' ? localStorage.getItem('elmaneko_empresa_id') : null) || 'no_tenant';
    const key = `elmaneko_cache_${empId}_global_pricing_config`;
    const sanitized: GlobalPricingConfig = {
      margemLucroPadrao: Math.max(0, Number(config.margemLucroPadrao || 0)),
      outrasDespesasPadrao: Math.max(0, Number(config.outrasDespesasPadrao || 0)),
      valorMaoDeObraPadrao: Math.max(0, Number(config.valorMaoDeObraPadrao || 0)),
    };
    localStorage.setItem(key, JSON.stringify(sanitized));
  } catch (e) {}
}

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

export interface PricingCalculationInput {
  materials?: BOMItem[];
  filaments: Filament[];
  tempoImpressao: number;
  impressoraPadraoId?: string;
  printers?: Printer[];
  tariffs: EnergyTariff[];
  margemLucro?: number | null;
  outrasDespesas?: number | null;
  valorMaoDeObra?: number | null;
  overPercent?: number | null;
  hasCustomMargemLucro?: boolean;
  hasCustomMaoDeObra?: boolean;
  hasCustomOutrasDespesas?: boolean;
  globalConfig?: GlobalPricingConfig;
}

export interface PricingCalculationResult {
  costBOM: number;
  costEnergy: number;
  valorMaoDeObra: number;
  outrasDespesas: number;
  costTotal: number;
  margemLucro: number;
  overPercent: number;
  suggestedPrice: number;
  effectiveTariff: number;
  isUsingGlobalMargin: boolean;
  isUsingGlobalOutrasDespesas: boolean;
  isUsingGlobalMaoDeObra: boolean;
  isMaoDeObraCapped?: boolean;
  isOutrasDespesasCapped?: boolean;
}

export function calculateProductPricing(input: PricingCalculationInput): PricingCalculationResult {
  const global = input.globalConfig || getGlobalPricingConfig();

  // 1. Cost of Materials (BOM)
  const costBOM = Number(bomCost(input.materials, input.filaments).toFixed(2));

  // 2. Cost of Energy
  const tariffRate = activeEnergyRate(input.tariffs);
  let printerWatts = 350; // Fallback standard
  if (input.impressoraPadraoId && input.printers && input.printers.length > 0) {
    const printer = input.printers.find(p => p.id === input.impressoraPadraoId);
    if (printer && printer.potenciaWatts > 0) {
      printerWatts = printer.potenciaWatts;
    }
  }
  const consumptionKwh = (printerWatts * Math.max(0, input.tempoImpressao)) / 1000;
  const costEnergy = Number((consumptionKwh * tariffRate).toFixed(2));

  // 3. Determine custom vs global inheritance
  const isUsingGlobalMargin = !input.hasCustomMargemLucro && (input.margemLucro === undefined || input.margemLucro === null);
  const isUsingGlobalMaoDeObra = !input.hasCustomMaoDeObra && (input.valorMaoDeObra === undefined || input.valorMaoDeObra === null);
  const isUsingGlobalOutrasDespesas = !input.hasCustomOutrasDespesas && (input.outrasDespesas === undefined || input.outrasDespesas === null);

  const margemLucro = Math.max(0, isUsingGlobalMargin ? global.margemLucroPadrao : Number(input.margemLucro ?? global.margemLucroPadrao));
  const rawValorMaoDeObra = Math.max(0, isUsingGlobalMaoDeObra ? global.valorMaoDeObraPadrao : Number(input.valorMaoDeObra ?? global.valorMaoDeObraPadrao));
  const outrasDespesas = Math.max(0, isUsingGlobalOutrasDespesas ? global.outrasDespesasPadrao : Number(input.outrasDespesas ?? global.outrasDespesasPadrao));
  const overPercent = Math.max(0, Number(input.overPercent ?? 0));

  // Custo do produto sem a mão de obra aplicada (BOM + Energia + Outras Despesas)
  const baseCostWithoutLabor = Number((costBOM + costEnergy + outrasDespesas).toFixed(2));

  // A mão de obra aplicada não pode passar de 50% do custo do produto sem a mão de obra
  const maxLaborAllowed = Number((baseCostWithoutLabor * 0.50).toFixed(2));
  const valorMaoDeObra = Math.min(rawValorMaoDeObra, maxLaborAllowed);
  const isMaoDeObraCapped = valorMaoDeObra < rawValorMaoDeObra;

  // 4. Total Manufacturing Cost (BOM + Energy + Labor + Other Expenses)
  const costTotal = Number((costBOM + costEnergy + valorMaoDeObra + outrasDespesas).toFixed(2));

  // 5. Final Selling Price
  const totalMarkup = 1 + (margemLucro + overPercent) / 100;
  const suggestedPrice = Number((costTotal * totalMarkup).toFixed(2));

  return {
    costBOM,
    costEnergy,
    valorMaoDeObra: Number(valorMaoDeObra.toFixed(2)),
    outrasDespesas: Number(outrasDespesas.toFixed(2)),
    costTotal,
    margemLucro,
    overPercent,
    suggestedPrice,
    effectiveTariff: tariffRate,
    isUsingGlobalMargin,
    isUsingGlobalOutrasDespesas,
    isUsingGlobalMaoDeObra,
    isMaoDeObraCapped,
    isOutrasDespesasCapped: false,
  };
}

export function suggestedProductPrice(product: Product, filaments: Filament[], energyRate = 0.85) {
  if (product.precoVenda && product.precoVenda > 0) return product.precoVenda;
  const calc = calculateProductPricing({
    materials: product.materials,
    filaments,
    tempoImpressao: product.tempoImpressao,
    impressoraPadraoId: product.impressoraPadraoId,
    tariffs: [{ id: 'active', dataInicio: '2000-01-01', valorKwh: energyRate }],
    margemLucro: product.margemLucro,
    outrasDespesas: product.outrasDespesas,
    valorMaoDeObra: product.valorMaoDeObra,
    overPercent: product.overPercent,
    hasCustomMargemLucro: product.hasCustomMargemLucro,
    hasCustomMaoDeObra: product.hasCustomMaoDeObra,
    hasCustomOutrasDespesas: product.hasCustomOutrasDespesas
  });
  return calc.suggestedPrice;
}

export function budgetSubtotal(items: BudgetItem[]) {
  return items.reduce((total, item) => total + item.quantidade * Math.max(0, item.valorUnitario - item.desconto), 0);
}

export function budgetTotal(items: BudgetItem[], discount = 0) {
  return Math.max(0, budgetSubtotal(items) - discount);
}

