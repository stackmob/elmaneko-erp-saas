import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Sliders, Zap, Calendar, History, Plus, RotateCcw, 
  CheckCircle2, AlertTriangle, Info, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';
import { Modal } from './ui/Modal';
import { TooltipHint } from './ui/TooltipHint';
import { formatDateBR } from '../utils/formatters';
import { 
  getGlobalPricingConfig, saveGlobalPricingConfig, calculateProductPricing, activeEnergyRate
} from '../utils/businessCalculations';
import { EnergyTariff, GlobalPricingConfig, Product } from '../types';
import { addToLocalCache } from '../utils/storage';

export interface RecalculationPreviewItem {
  product: Product;
  currentPrice: number;
  newPrice: number;
  diffAmount: number;
  diffPercent: number;
  usingGlobalMargin: boolean;
  usingGlobalMaoDeObra: boolean;
  usingGlobalOutrasDespesas: boolean;
}

export default function PricingConfigModule() {
  const { 
    useTarifas, useAddTarifa, useProdutos, useFilamentos, useImpressoras, useUpdateProduto 
  } = useData();
  
  const { data: tariffs = [] } = useTarifas();
  const { data: products = [] } = useProdutos();
  const { data: filaments = [] } = useFilamentos();
  const { data: printers = [] } = useImpressoras();
  
  const addTarifaMutation = useAddTarifa();
  const updateProdutoMutation = useUpdateProduto();
  const { toast, showToast, hideToast } = useToast();

  // GLOBAL CONFIG STATE
  const [globalConfig, setGlobalConfig] = useState<GlobalPricingConfig>(() => getGlobalPricingConfig());
  const [margemLucroPadrao, setMargemLucroPadrao] = useState<number>(100);
  const [outrasDespesasPadrao, setOutrasDespesasPadrao] = useState<number>(0);
  const [valorMaoDeObraPadrao, setValorMaoDeObraPadrao] = useState<number>(30);

  useEffect(() => {
    const current = getGlobalPricingConfig();
    setGlobalConfig(current);
    setMargemLucroPadrao(current.margemLucroPadrao);
    setOutrasDespesasPadrao(current.outrasDespesasPadrao);
    setValorMaoDeObraPadrao(current.valorMaoDeObraPadrao);
  }, []);

  // ENERGY TARIFF FORM STATE
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [tariffDataInicio, setTariffDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [tariffValorKwh, setTariffValorKwh] = useState(0.85);

  // BULK RECALCULATE MODAL & PREVIEW STATE
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState<RecalculationPreviewItem[]>([]);
  const [isExecutingRecalc, setIsExecutingRecalc] = useState(false);
  const [recalcSummary, setRecalcSummary] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // SAVE GLOBAL CONFIG FORM
  const handleSaveGlobalConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (margemLucroPadrao < 0 || outrasDespesasPadrao < 0 || valorMaoDeObraPadrao < 0) {
      showToast('Os valores globais não podem ser negativos.', 'error');
      return;
    }

    const newConfig: GlobalPricingConfig = {
      margemLucroPadrao: Number(margemLucroPadrao),
      outrasDespesasPadrao: Number(outrasDespesasPadrao),
      valorMaoDeObraPadrao: Number(valorMaoDeObraPadrao),
    };

    saveGlobalPricingConfig(newConfig);
    setGlobalConfig(newConfig);
    showToast('Parâmetros globais de precificação salvos com sucesso!', 'success');
  };

  // ADD TARIFF HANDLER
  const handleAddTariff = (e: React.FormEvent) => {
    e.preventDefault();
    if (tariffValorKwh <= 0 || !tariffDataInicio) {
      showToast('Por favor, informe uma data válida e valor por kWh maior que zero.', 'error');
      return;
    }

    const newTariff: EnergyTariff = {
      id: crypto.randomUUID(),
      dataInicio: tariffDataInicio,
      valorKwh: Number(tariffValorKwh)
    };

    addTarifaMutation.mutate(newTariff, {
      onSuccess: () => {
        showToast(`Tarifa de R$ ${Number(tariffValorKwh).toFixed(4)}/kWh cadastrada com sucesso!`, 'success');
        setIsTariffModalOpen(false);
      },
      onError: () => showToast('Erro ao salvar tarifa. Tente novamente.', 'error')
    });
  };

  // PREPARE BULK RECALCULATION PREVIEW
  const handleOpenRecalculationPreview = () => {
    if (products.length === 0) {
      showToast('Nenhum produto cadastrado para recalcular.', 'warning');
      return;
    }

    const activeConfig = getGlobalPricingConfig();

    const items: RecalculationPreviewItem[] = products.map((prod) => {
      const calc = calculateProductPricing({
        materials: prod.materials,
        filaments,
        tempoImpressao: prod.tempoImpressao,
        impressoraPadraoId: prod.impressoraPadraoId,
        printers,
        tariffs,
        margemLucro: prod.margemLucro,
        outrasDespesas: prod.outrasDespesas,
        valorMaoDeObra: prod.valorMaoDeObra,
        overPercent: prod.overPercent,
        hasCustomMargemLucro: prod.hasCustomMargemLucro,
        hasCustomMaoDeObra: prod.hasCustomMaoDeObra,
        hasCustomOutrasDespesas: prod.hasCustomOutrasDespesas,
        globalConfig: activeConfig
      });

      const currentPrice = prod.precoVenda && prod.precoVenda > 0 ? prod.precoVenda : calc.suggestedPrice;
      const newPrice = calc.suggestedPrice;
      const diffAmount = Number((newPrice - currentPrice).toFixed(2));
      const diffPercent = currentPrice > 0 ? Number(((diffAmount / currentPrice) * 100).toFixed(2)) : 0;

      return {
        product: prod,
        currentPrice,
        newPrice,
        diffAmount,
        diffPercent,
        usingGlobalMargin: calc.isUsingGlobalMargin,
        usingGlobalMaoDeObra: calc.isUsingGlobalMaoDeObra,
        usingGlobalOutrasDespesas: calc.isUsingGlobalOutrasDespesas
      };
    });

    setPreviewItems(items);
    setRecalcSummary(null);
    setIsPreviewModalOpen(true);
  };

  // EXECUTE BULK RECALCULATION
  const handleConfirmRecalculation = async () => {
    setIsExecutingRecalc(true);
    let successCount = 0;
    let failedCount = 0;
    const errorMessages: string[] = [];
    const activeConfig = getGlobalPricingConfig();

    for (const item of previewItems) {
      try {
        const prod = item.product;
        const calc = calculateProductPricing({
          materials: prod.materials,
          filaments,
          tempoImpressao: prod.tempoImpressao,
          impressoraPadraoId: prod.impressoraPadraoId,
          printers,
          tariffs,
          margemLucro: prod.margemLucro,
          outrasDespesas: prod.outrasDespesas,
          valorMaoDeObra: prod.valorMaoDeObra,
          overPercent: prod.overPercent,
          hasCustomMargemLucro: prod.hasCustomMargemLucro,
          hasCustomMaoDeObra: prod.hasCustomMaoDeObra,
          hasCustomOutrasDespesas: prod.hasCustomOutrasDespesas,
          globalConfig: activeConfig
        });

        // Keep product specific overrides intact, only update final price and effective values
        const updatedProduct: Product = {
          ...prod,
          valorMaoDeObra: calc.isUsingGlobalMaoDeObra ? activeConfig.valorMaoDeObraPadrao : prod.valorMaoDeObra,
          outrasDespesas: calc.isUsingGlobalOutrasDespesas ? activeConfig.outrasDespesasPadrao : prod.outrasDespesas,
          margemLucro: calc.isUsingGlobalMargin ? activeConfig.margemLucroPadrao : prod.margemLucro,
          precoVenda: calc.suggestedPrice
        };

        await updateProdutoMutation.mutateAsync(updatedProduct);
        successCount++;
      } catch (err: any) {
        failedCount++;
        errorMessages.push(`Falha ao recalcular "${item.product.nome}": ${err?.message || 'Erro desconhecido'}`);
      }
    }

    // Register operation audit log
    try {
      addToLocalCache('operation_logs', {
        id: crypto.randomUUID(),
        usuario: 'Tenant Admin',
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('pt-BR'),
        tipoOperacao: 'Estoque',
        descricao: `Recálculo em massa de preços de produtos: ${successCount} atualizados com sucesso, ${failedCount} falhas.`,
        resultado: failedCount === 0 ? 'Sucesso' : 'Erro',
        detalhes: JSON.stringify({ successCount, failedCount, errors: errorMessages })
      });
    } catch (e) {}

    setIsExecutingRecalc(false);
    setRecalcSummary({
      success: successCount,
      failed: failedCount,
      errors: errorMessages
    });

    if (failedCount === 0) {
      showToast(`Recálculo em massa concluído! ${successCount} produtos atualizados com sucesso.`, 'success');
    } else {
      showToast(`Recálculo concluído com avisos: ${successCount} atualizados, ${failedCount} falhas.`, 'warning');
    }
  };

  // Tariff Sorting
  const sortedTariffs = [...tariffs].sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
  const activeTariff = sortedTariffs[0];

  return (
    <div className="space-y-6" id="pricing-config-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="pricing-config-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders size={22} className="text-orange-500" />
            Custos e Preço de Venda
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Configure os parâmetros globais de custos de manufatura, tarifas de energia e execute o recálculo dos preços do catálogo.
          </p>
        </div>

        <button
          onClick={handleOpenRecalculationPreview}
          disabled={products.length === 0}
          id="bulk-recalculate-btn"
          className="py-2.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw size={16} />
          Recalcular Preços de Todos os Produtos
        </button>
      </div>

      {/* SECTION 1: GLOBAL CONFIG & FORMATION OF PRICES */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4" id="global-costs-card">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <DollarSign size={16} className="text-orange-500" />
            Parâmetros Globais de Formação do Preço
          </h3>
          <span className="text-[11px] font-mono text-neutral-500">Valores Padrão de Herança</span>
        </div>

        <form onSubmit={handleSaveGlobalConfig} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Margem de Lucro Padrão */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <label className="block text-neutral-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                Margem de Lucro Padrão (%)
                <TooltipHint content="Porcentagem de margem de lucro aplicada por padrão aos produtos sem margem customizada." />
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  step="0.5"
                  min="0"
                  value={margemLucroPadrao}
                  onChange={(e) => setMargemLucroPadrao(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-orange-500"
                />
                <span className="text-neutral-400 font-bold">%</span>
              </div>
              <p className="text-[10px] text-neutral-500">Padrão do sistema: 100% sobre o custo total.</p>
            </div>

            {/* Mão de Obra Padrão */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <label className="block text-neutral-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                Mão de Obra Padrão (R$)
                <TooltipHint content="Custo fixo padrão de mão de obra em reais para fatiamento, setup e pós-processamento." />
              </label>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-bold">R$</span>
                <input
                  type="number"
                  required
                  step="0.5"
                  min="0"
                  value={valorMaoDeObraPadrao}
                  onChange={(e) => setValorMaoDeObraPadrao(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-orange-500"
                />
              </div>
              <p className="text-[10px] text-neutral-500">Padrão do sistema: R$ 30,00 por produto.</p>
            </div>

            {/* Outras Despesas Padrão */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
              <label className="block text-neutral-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                Outras Despesas Padrão (R$)
                <TooltipHint content="Outras despesas secundárias padrão (embalagem, parafusos, adesivo) em reais." />
              </label>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-bold">R$</span>
                <input
                  type="number"
                  required
                  step="0.5"
                  min="0"
                  value={outrasDespesasPadrao}
                  onChange={(e) => setOutrasDespesasPadrao(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-orange-500"
                />
              </div>
              <p className="text-[10px] text-neutral-500">Padrão do sistema: R$ 0,00 por produto.</p>
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="py-2 px-5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/10 flex items-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle2 size={16} />
              Salvar Parâmetros Globais
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: ENERGY TARIFFS INTEGRATED */}
      <div className="space-y-6" id="integrated-energy-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              <Zap size={20} className="text-orange-500 animate-pulse" />
              Tarifas de Energia kWh
            </h3>
            <TooltipHint content="Configure as tarifas de energia elétrica por kWh para os cálculos exatos nas impressoras 3D." />
          </div>
          <button
            onClick={() => {
              setTariffDataInicio(new Date().toISOString().split('T')[0]);
              setTariffValorKwh(activeTariff ? activeTariff.valorKwh : 0.85);
              setIsTariffModalOpen(true);
            }}
            id="add-tariff-btn-integrated"
            className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-750 text-white font-semibold rounded-xl border border-neutral-700 flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Plus size={16} className="text-orange-400" />
            Nova Alíquota de kWh
          </button>
        </div>

        {/* TARIFF KPIS & HISTÓRICO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
            <h4 className="text-xs font-mono uppercase text-orange-500 tracking-widest font-bold mb-4 flex items-center gap-1.5">
              <Zap size={14} /> Tarifa Ativa no Sistema
            </h4>
            {activeTariff ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm text-neutral-400 font-mono">R$</span>
                  <span className="text-4xl font-black text-white">{activeTariff.valorKwh.toFixed(4)}</span>
                  <span className="text-xs text-neutral-500 font-mono">/ kWh</span>
                </div>
                <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 pt-2 border-t border-neutral-800/60 mt-4">
                  <Calendar size={12} className="text-neutral-500" />
                  Vigência iniciada em: <strong>{formatDateBR(activeTariff.dataInicio)}</strong>
                </p>
              </div>
            ) : (
              <span className="text-neutral-500 font-mono text-xs">Nenhuma tarifa cadastrada. Usando taxa padrão (R$ 0,85/kWh).</span>
            )}
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-xs text-neutral-400 leading-relaxed space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <History size={16} className="text-neutral-500" /> Regra de Aplicação
            </h4>
            <p>
              O sistema calcula o consumo de energia multiplicando o consumo da impressora padrão pelo tempo de produção e pelo valor por kWh da tarifa ativa.
            </p>
            <p className="font-mono bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/60 text-neutral-300">
              • O recálculo de preços utiliza a tarifa ativa mais recente cadastrada no histórico.
            </p>
          </div>
        </div>

        {/* HISTÓRICO DE TARIFAS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-neutral-950/40 border-b border-neutral-800 flex items-center gap-2">
            <History size={16} className="text-neutral-500" />
            <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider font-semibold">Histórico de Alterações de Tarifas</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/20 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  <th className="py-3.5 px-6 font-semibold">Data Início da Vigência</th>
                  <th className="py-3.5 px-6 font-semibold">Valor por kWh</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Identificador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-300">
                {sortedTariffs.map((t, idx) => {
                  const isActive = idx === 0;
                  return (
                    <tr key={t.id} className="hover:bg-neutral-800/10 transition-colors">
                      <td className="py-3 px-6 font-mono text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <Calendar size={14} className="text-neutral-500" />
                          {formatDateBR(t.dataInicio)}
                        </div>
                      </td>
                      <td className="py-3 px-6 font-mono font-bold text-orange-400 text-xs">
                        R$ {t.valorKwh.toFixed(4)} <span className="text-[10px] font-normal text-neutral-500">/ kWh</span>
                      </td>
                      <td className="py-3 px-6">
                        {isActive ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 rounded-md">
                            Ativa Atualmente
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[10px] font-mono bg-neutral-950 border border-neutral-800 text-neutral-500 rounded-md">
                            Histórico
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right font-mono text-xs text-neutral-500">
                        {t.id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DIALOG FORM: NOVA TARIFA DE ENERGIA */}
      {isTariffModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-5 sm:p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={20} className="text-orange-500" />
              Cadastrar Nova Tarifa
            </h3>

            <form onSubmit={handleAddTariff} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Início da Vigência *</label>
                <input
                  type="date"
                  required
                  value={tariffDataInicio}
                  onChange={(e) => setTariffDataInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Valor do kWh (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-mono font-bold">R$</span>
                  <input
                    type="number"
                    required
                    step="0.0001"
                    min="0.0001"
                    value={tariffValorKwh}
                    onChange={(e) => setTariffValorKwh(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsTariffModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Salvar Vigência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK RECALCULATE PREVIEW MODAL */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => !isExecutingRecalc && setIsPreviewModalOpen(false)}
        maxWidth="4xl"
        title={
          <span className="flex items-center gap-2">
            <RotateCcw size={20} className="text-orange-500" />
            Prévia do Recálculo em Massa de Preços
          </span>
        }
        footer={
          <>
            <button
              type="button"
              disabled={isExecutingRecalc}
              onClick={() => setIsPreviewModalOpen(false)}
              className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isExecutingRecalc || previewItems.length === 0}
              onClick={handleConfirmRecalculation}
              className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isExecutingRecalc ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Confirmar Recálculo ({previewItems.length} Produtos)
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4 font-mono text-xs">
          
          <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl text-amber-200 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-400">
              <AlertTriangle size={16} /> Confirmação necessária:
            </p>
            <p>
              Você está prestes a recalcular o preço de venda de <strong>{previewItems.length} produtos ativos</strong>. 
              As configurações específicas/exceções cadastradas em cada produto serão rigorosamente preservadas.
            </p>
          </div>

          {recalcSummary && (
            <div className={`p-4 rounded-xl border text-xs ${recalcSummary.failed === 0 ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-red-950/40 border-red-500/30 text-red-300'}`}>
              <h4 className="font-bold uppercase mb-1">Resultado da Execução:</h4>
              <p>• Sucessos: <strong>{recalcSummary.success} produtos</strong></p>
              <p>• Falhas: <strong>{recalcSummary.failed} produtos</strong></p>
              {recalcSummary.errors.length > 0 && (
                <div className="mt-2 space-y-1 text-[11px] bg-black/40 p-2 rounded">
                  {recalcSummary.errors.map((err, i) => (
                    <p key={i} className="text-red-400">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PREVIEW TABLE */}
          <div className="border border-neutral-800 rounded-xl overflow-hidden">
            <div className="max-h-[350px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-neutral-950 border-b border-neutral-800 text-[10px] uppercase text-neutral-400">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Produto</th>
                    <th className="py-2.5 px-3 font-semibold">Herança</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Preço Atual</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Novo Preço</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Diferença R$</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Variação %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850 text-xs">
                  {previewItems.map((item) => {
                    const isIncrease = item.diffAmount > 0;
                    const isDecrease = item.diffAmount < 0;
                    const hasCustom = !item.usingGlobalMargin || !item.usingGlobalMaoDeObra || !item.usingGlobalOutrasDespesas;

                    return (
                      <tr key={item.product.id} className="hover:bg-neutral-900/50">
                        <td className="py-2 px-3 font-bold text-white">
                          {item.product.nome}
                        </td>
                        <td className="py-2 px-3">
                          {hasCustom ? (
                            <span className="px-1.5 py-0.5 text-[9px] bg-amber-950/60 border border-amber-500/30 text-amber-300 rounded font-mono">
                              Exceção Específica
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[9px] bg-neutral-800 border border-neutral-700 text-neutral-400 rounded font-mono">
                              Padrão Global
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-neutral-400">
                          R$ {item.currentPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-orange-400">
                          R$ {item.newPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          <span className={isIncrease ? 'text-emerald-400' : isDecrease ? 'text-red-400' : 'text-neutral-500'}>
                            {isIncrease ? `+R$ ${item.diffAmount.toFixed(2)}` : isDecrease ? `-R$ ${Math.abs(item.diffAmount).toFixed(2)}` : 'R$ 0,00'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[11px]">
                          <span className={`inline-flex items-center gap-0.5 ${isIncrease ? 'text-emerald-400' : isDecrease ? 'text-red-400' : 'text-neutral-500'}`}>
                            {isIncrease && <ArrowUpRight size={12} />}
                            {isDecrease && <ArrowDownRight size={12} />}
                            {item.diffPercent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </Modal>

    </div>
  );
}
