import React, { useState } from 'react';
import { ProductionOrder, Product, Printer, Filament, EnergyTariff, StockMovement, ProductStock, FilamentType } from '../types';
import { 
  Plus, Play, CheckCircle, XCircle, Clock, Calendar, 
  User, Database, Zap, Sparkles, AlertOctagon, HelpCircle, FileText, Search, Printer as PrinterIcon 
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';

export default function Production() {
  const { useProducoes, useProdutos, useImpressoras, useFilamentos, useTarifas, useAddProducao, useUpdateProducao } = useData();
  const { data: productions = [] } = useProducoes();
  const { data: products = [] } = useProdutos();
  const { data: printers = [] } = useImpressoras();
  const { data: filaments = [] } = useFilamentos();
  const { data: tariffs = [] } = useTarifas();
  const addMutation = useAddProducao();
  const updateMutation = useUpdateProducao();
  const { toast, showToast, hideToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'nova' | 'historico' | 'relatorios'>('historico');

  // FILTERS
  const [filterProduct, setFilterProduct] = useState('todos');
  const [filterPrinter, setFilterPrinter] = useState('todos');
  const [filterOperator, setFilterOperator] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // FORM FIELDS (Nova Produção)
  const [formData, setFormData] = useState({
    produtoId: products.length > 0 ? products[0].id : '',
    quantidade: 1,
    impressoraId: printers.length > 0 ? printers[0].id : '',
    operador: '',
    status: 'Em Produção' as 'Em Produção' | 'Finalizada',
    maoDeObraEscolha: 'unitario' as 'unitario' | 'total',
    maoDeObraValor: 0,
    observacoes: ''
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Active electricity tariff rate
  const getActiveTariff = (): number => {
    if (tariffs.length === 0) return 0.85;
    const sorted = [...tariffs].sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
    return sorted[0].valorKwh;
  };
  const currentTariff = getActiveTariff();

  // Polimer rate helper (Max rate in active inventory)
  const getMaxCostPerGram = (type: FilamentType): number => {
    const typeFilaments = filaments.filter(f => f.tipo === type);
    if (typeFilaments.length === 0) return 0.12; // average fallback
    let max = 0;
    typeFilaments.forEach(f => {
      const r = f.valorCompra / f.pesoTotal;
      if (r > max) max = r;
    });
    return max;
  };

  // When changing product, load defaults automatically
  const handleProductChange = (pId: string) => {
    const prodObj = products.find(p => p.id === pId);
    if (!prodObj) return;

    setFormData(prev => ({
      ...prev,
      produtoId: pId,
      impressoraId: prodObj.impressoraPadraoId || prev.impressoraId,
      maoDeObraValor: prodObj.valorMaoDeObra
    }));
    setFormError('');
  };

  // COST ESTIMATORS (Realized dynamically based on current selected product and printer)
  const selectedProduct = products.find(p => p.id === formData.produtoId);
  const selectedPrinter = printers.find(p => p.id === formData.impressoraId);

  let estFilamentCost = 0;
  let estEnergyCost = 0;
  let estLaborCost = 0;
  let estTotalCost = 0;
  let estUnitCost = 0;

  if (selectedProduct) {
    // 1. Filament cost based on BOM
    estFilamentCost = selectedProduct.materials.reduce((acc, mat) => {
      const maxRate = getMaxCostPerGram(mat.tipoFilamento);
      return acc + (mat.quantidadeGrams * maxRate);
    }, 0) * formData.quantidade;

    // 2. Energy cost based on printer power and print hours
    if (selectedPrinter) {
      const consumptionKwh = (selectedPrinter.potenciaWatts * selectedProduct.tempoImpressao) / 1000;
      estEnergyCost = consumptionKwh * currentTariff * formData.quantidade;
    }

    // 3. Labor cost
    if (formData.maoDeObraEscolha === 'unitario') {
      estLaborCost = formData.maoDeObraValor * formData.quantidade;
    } else {
      estLaborCost = formData.maoDeObraValor;
    }

    estTotalCost = estFilamentCost + estEnergyCost + estLaborCost;
    estUnitCost = estTotalCost / formData.quantidade;
  }

  // SUBMIT HANDLER: CREATE NEW PRODUCTION RUN
  const handleCreateProduction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.produtoId || !formData.impressoraId || formData.quantidade <= 0) {
      setFormError('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    const prodObj = products.find(p => p.id === formData.produtoId);
    if (!prodObj) {
      setFormError('Produto não localizado.');
      return;
    }

    // CM-04: Numeração baseada no maior número existente (evita duplicação após deleções)
    const maxNum = productions.reduce((max, p) => {
      const n = parseInt(p.numero.replace('PROD-', ''), 10) || 0;
      return n > max ? n : max;
    }, 0);
    const newProdOrderNo = `PROD-${String(maxNum + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString().split('T')[0];

    // Arrays to collect updates
    const stockMovements: StockMovement[] = [];
    const updatedFilaments = [...filaments];
    const updatedProductStocks: ProductStock[] = [];

    // IF FINALIZED IMMEDIATELY: CHECK STOCK SUFFICIENCY & PREPARE DEDUCTIONS
    if (formData.status === 'Finalizada') {
      let isStockSufficient = true;
      const stockErrors: string[] = [];

      // Check each material in the product BOM
      prodObj.materials.forEach(mat => {
        const totalNeeded = mat.quantidadeGrams * formData.quantidade;
        
        // locate exact filament used or match by polimer type (we deduct from the matching spool with largest stock)
        let matchedFilament = filaments.find(f => f.id === mat.filamentoId);
        if (!matchedFilament || mat.filamentoId === 'any') {
          // find spool of same type with highest stock
          const typeSpools = filaments
            .filter(f => f.tipo === mat.tipoFilamento)
            .sort((a, b) => b.quantidadeDisponivel - a.quantidadeDisponivel);
          if (typeSpools.length > 0) {
            matchedFilament = typeSpools[0];
          }
        }

        if (!matchedFilament || matchedFilament.quantidadeDisponivel < totalNeeded) {
          isStockSufficient = false;
          stockErrors.push(`${mat.tipoFilamento} (Necessário: ${totalNeeded}g, Disponível: ${matchedFilament ? matchedFilament.quantidadeDisponivel : 0}g)`);
        } else {
          // Record deduction logic
          const idx = updatedFilaments.findIndex(f => f.id === matchedFilament!.id);
          if (idx !== -1) {
            updatedFilaments[idx] = {
              ...updatedFilaments[idx],
              quantidadeDisponivel: updatedFilaments[idx].quantidadeDisponivel - totalNeeded
            };

            // Register movement
            stockMovements.push({
              id: `mvt-${Date.now()}-${matchedFilament!.id}`,
              data: timestamp,
              tipo: 'saida',
              origem: 'producao_consumo',
              referenciaId: newProdOrderNo,
              filamentoId: matchedFilament!.id,
              quantidade: totalNeeded,
              descricao: `Consumo de ${totalNeeded}g de ${matchedFilament!.tipo} (${matchedFilament!.cor}) na ordem ${newProdOrderNo}`
            });
          }
        }
      });

      if (!isStockSufficient) {
        setFormError(`Estoque insuficiente para concluir esta produção: ${stockErrors.join(', ')}.`);
        return;
      }

      // Record entry for finished product
      stockMovements.push({
        id: `mvt-${Date.now()}-prod-entry`,
        data: timestamp,
        tipo: 'entrada',
        origem: 'producao_entrada',
        referenciaId: newProdOrderNo,
        produtoId: formData.produtoId,
        quantidade: formData.quantidade,
        descricao: `Fabricação concluída de ${formData.quantidade}x ${prodObj.nome} (${newProdOrderNo})`
      });
    }

    // Prepare production order object
    const newOrder: ProductionOrder = {
      id: crypto.randomUUID(),
      numero: newProdOrderNo,
      data: timestamp,
      produtoId: formData.produtoId,
      quantidade: Number(formData.quantidade),
      impressoraId: formData.impressoraId,
      operador: formData.operador || 'Admin',
      status: formData.status,
      custoFilamento: formData.status === 'Finalizada' ? estFilamentCost : 0,
      custoEnergia: formData.status === 'Finalizada' ? estEnergyCost : 0,
      custoMaoDeObra: formData.status === 'Finalizada' ? estLaborCost : 0,
      custoTotal: formData.status === 'Finalizada' ? estTotalCost : 0,
      custoUnitario: formData.status === 'Finalizada' ? estUnitCost : 0,
      maoDeObraEscolha: formData.maoDeObraEscolha,
      maoDeObraValor: Number(formData.maoDeObraValor),
      observacoes: formData.observacoes
    };

    addMutation.mutate(newOrder, {
      onSuccess: () => {
        showToast(`Ordem ${newProdOrderNo} registrada com sucesso!`, 'success');
      }
    });
    
    // reset form and notify
    setFormSuccess(`Ordem de Produção ${newProdOrderNo} registrada com sucesso!`);
    setTimeout(() => {
      setFormSuccess('');
      setActiveTab('historico');
    }, 2000);
  };

  // FINALIZE PRODUCTION FROM HISTORY
  const handleFinalizeFromHistory = (po: ProductionOrder) => {
    const prodObj = products.find(p => p.id === po.produtoId);
    if (!prodObj) {
      setFormError('Produto da ordem de produção não localizado.');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const updatedFilaments = [...filaments];
    const stockMovements: StockMovement[] = [];
    const updatedProductStocks: ProductStock[] = [];

    let isStockSufficient = true;
    const stockErrors: string[] = [];

    // Calculate real costs to freeze
    const finalFilamentCost = prodObj.materials.reduce((acc, mat) => {
      const maxRate = getMaxCostPerGram(mat.tipoFilamento);
      return acc + (mat.quantidadeGrams * maxRate);
    }, 0) * po.quantidade;

    const printerObj = printers.find(pr => pr.id === po.impressoraId);
    let finalEnergyCost = 0;
    if (printerObj) {
      const consumptionKwh = (printerObj.potenciaWatts * prodObj.tempoImpressao) / 1000;
      finalEnergyCost = consumptionKwh * currentTariff * po.quantidade;
    }

    const finalLaborCost = po.maoDeObraEscolha === 'unitario' ? po.maoDeObraValor * po.quantidade : po.maoDeObraValor;
    const finalTotalCost = finalFilamentCost + finalEnergyCost + finalLaborCost;
    const finalUnitCost = finalTotalCost / po.quantidade;

    // Check stock & deduct
    prodObj.materials.forEach(mat => {
      const totalNeeded = mat.quantidadeGrams * po.quantidade;
      let matchedFilament = filaments.find(f => f.id === mat.filamentoId);
      
      if (!matchedFilament || mat.filamentoId === 'any') {
        const typeSpools = filaments
          .filter(f => f.tipo === mat.tipoFilamento)
          .sort((a, b) => b.quantidadeDisponivel - a.quantidadeDisponivel);
        if (typeSpools.length > 0) {
          matchedFilament = typeSpools[0];
        }
      }

      if (!matchedFilament || matchedFilament.quantidadeDisponivel < totalNeeded) {
        isStockSufficient = false;
        stockErrors.push(`${mat.tipoFilamento} (Necessário: ${totalNeeded}g, Disponível: ${matchedFilament ? matchedFilament.quantidadeDisponivel : 0}g)`);
      } else {
        const idx = updatedFilaments.findIndex(f => f.id === matchedFilament!.id);
        if (idx !== -1) {
          updatedFilaments[idx] = {
            ...updatedFilaments[idx],
            quantidadeDisponivel: updatedFilaments[idx].quantidadeDisponivel - totalNeeded
          };

          stockMovements.push({
            id: `mvt-${Date.now()}-${matchedFilament!.id}`,
            data: timestamp,
            tipo: 'saida',
            origem: 'producao_consumo',
            referenciaId: po.numero,
            filamentoId: matchedFilament!.id,
            quantidade: totalNeeded,
            descricao: `Consumo de ${totalNeeded}g de ${matchedFilament!.tipo} (${matchedFilament!.cor}) na ordem ${po.numero}`
          });
        }
      }
    });

    if (!isStockSufficient) {
      alert(`Erro: Estoque insuficiente para concluir esta produção.\n${stockErrors.join('\n')}`);
      return;
    }

    // Record entry for finished product
    stockMovements.push({
      id: `mvt-${Date.now()}-prod-entry`,
      data: timestamp,
      tipo: 'entrada',
      origem: 'producao_entrada',
      referenciaId: po.numero,
      produtoId: po.produtoId,
      quantidade: po.quantidade,
      descricao: `Fabricação concluída de ${po.quantidade}x ${prodObj.nome} (${po.numero})`
    });

    // Freeze costs in order
    const updatedOrder = {
      ...po,
      custoFilamento: finalFilamentCost,
      custoEnergia: finalEnergyCost,
      custoMaoDeObra: finalLaborCost,
      custoTotal: finalTotalCost,
      custoUnitario: finalUnitCost
    };

    updateMutation.mutate(updatedOrder);
    alert(`Sucesso: Ordem de produção ${po.numero} finalizada com sucesso! Insumos baixados.`);
  };

  const handleCancelFromHistory = (po: ProductionOrder) => {
    if (confirm(`Deseja cancelar a ordem de produção ${po.numero}?`)) {
      updateMutation.mutate({ ...po, status: 'Cancelada' });
    }
  };

  // HISTORY FILTERS LOGIC
  const filteredProductions = productions.filter(po => {
    const matchesProduct = filterProduct === 'todos' || po.produtoId === filterProduct;
    const matchesPrinter = filterPrinter === 'todos' || po.impressoraId === filterPrinter;
    const matchesOperator = !filterOperator || (po.operador && po.operador.toLowerCase().includes(filterOperator.toLowerCase()));
    
    let matchesDate = true;
    if (filterDateStart) matchesDate = matchesDate && po.data >= filterDateStart;
    if (filterDateEnd) matchesDate = matchesDate && po.data <= filterDateEnd;

    return matchesProduct && matchesPrinter && matchesOperator && matchesDate;
  });

  // --- REPORTING LOGIC (MÓDULO DE RELATÓRIOS FINANCEIROS) ---
  const repProductions = productions.filter(po => {
    let match = po.status === 'Finalizada';
    if (filterProduct !== 'todos') match = match && po.produtoId === filterProduct;
    if (filterPrinter !== 'todos') match = match && po.impressoraId === filterPrinter;
    if (filterDateStart) match = match && po.data >= filterDateStart;
    if (filterDateEnd) match = match && po.data <= filterDateEnd;
    return match;
  });

  const repPiecesCount = repProductions.reduce((acc, po) => acc + po.quantidade, 0);
  const repTotalFilamentCost = repProductions.reduce((acc, po) => acc + po.custoFilamento, 0);
  const repTotalEnergyCost = repProductions.reduce((acc, po) => acc + po.custoEnergia, 0);
  const repTotalLaborCost = repProductions.reduce((acc, po) => acc + po.custoMaoDeObra, 0);
  const repTotalOverallCost = repProductions.reduce((acc, po) => acc + po.custoTotal, 0);

  // Print Hours sum in report
  const repTotalHours = repProductions.reduce((acc, po) => {
    const prodObj = products.find(p => p.id === po.produtoId);
    return acc + (prodObj ? prodObj.tempoImpressao * po.quantidade : 0);
  }, 0);

  const repTotalKwh = repProductions.reduce((acc, po) => {
    const printerObj = printers.find(p => p.id === po.impressoraId);
    const prodObj = products.find(p => p.id === po.produtoId);
    if (!printerObj || !prodObj) return acc;
    return acc + ((printerObj.potenciaWatts * prodObj.tempoImpressao) / 1000 * po.quantidade);
  }, 0);

  return (
    <div className="space-y-6" id="production-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
      
      {/* 1. VIEW TOGGLE BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Módulo de Produção 3D</h2>
          <p className="text-sm text-neutral-400 mt-0.5">Faturamento de peças, consumo real de polímeros, e auditoria financeira congelada.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800/80 font-mono text-xs">
          <button
            onClick={() => { setActiveTab('historico'); setFormError(''); }}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeTab === 'historico' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            Histórico Queue
          </button>
          <button
            onClick={() => { setActiveTab('nova'); setFormError(''); }}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeTab === 'nova' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            Nova Produção
          </button>
          <button
            onClick={() => { setActiveTab('relatorios'); setFormError(''); }}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${activeTab === 'relatorios' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            Relatório Custos
          </button>
        </div>
      </div>

      {/* 2. SUBTABS ROUTING */}

      {/* --- SUBTAB: NOVA PRODUÇÃO --- */}
      {activeTab === 'nova' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="nova-producao-form-wrapper">
          
          {/* Form Side (2/3 width) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-sm font-mono uppercase tracking-widest text-orange-500 font-bold mb-4 flex items-center gap-1.5">
              <Play size={14} /> Registrar Nova Ordem de Produção
            </h3>

            {formError && (
              <div className="mb-4 p-4 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2" id="prod-stock-error">
                <AlertOctagon size={16} className="text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs rounded-xl" id="prod-stock-success">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateProduction} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Produto */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Produto / Peça *</label>
                  <select
                    value={formData.produtoId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">Selecione o produto acabado...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Quantidade */}
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Quantidade Produzida *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.quantidade}
                    onChange={(e) => setFormData(p => ({ ...p, quantidade: Math.max(1, Number(e.target.value)) }))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Impressora */}
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Impressora Utilizada *</label>
                  <select
                    value={formData.impressoraId}
                    onChange={(e) => setFormData(p => ({ ...p, impressoraId: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {printers.map(pr => (
                      <option key={pr.id} value={pr.id}>{pr.nome} ({pr.status})</option>
                    ))}
                  </select>
                </div>

                {/* Operador */}
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Operador responsável (Opcional)</label>
                  <input
                    type="text"
                    value={formData.operador}
                    onChange={(e) => setFormData(p => ({ ...p, operador: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Mão de obra config */}
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Configuração Mão de Obra *</label>
                  <select
                    value={formData.maoDeObraEscolha}
                    onChange={(e) => setFormData(p => ({ ...p, maoDeObraEscolha: e.target.value as 'unitario' | 'total' }))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="unitario">Valor por UNIDADE produzida</option>
                    <option value="total">Valor TOTAL do lote produzido</option>
                  </select>
                </div>

                {/* Mão de Obra Valor */}
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Valor da Mão de Obra R$ *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.maoDeObraValor}
                    onChange={(e) => setFormData(p => ({ ...p, maoDeObraValor: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Status da producao ao salvar */}
                <div className="col-span-2">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Situação Inicial da Ordem *</label>
                  <div className="flex gap-4 p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                      <input
                        type="radio"
                        name="init_status"
                        checked={formData.status === 'Em Produção'}
                        onChange={() => setFormData(p => ({ ...p, status: 'Em Produção' }))}
                        className="text-orange-500 focus:ring-0"
                      />
                      <span>Em Produção (Fila Ativa)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                      <input
                        type="radio"
                        name="init_status"
                        checked={formData.status === 'Finalizada'}
                        onChange={() => setFormData(p => ({ ...p, status: 'Finalizada' }))}
                        className="text-orange-500 focus:ring-0"
                      />
                      <span className="text-emerald-400 font-bold">Finalizada e baixar estoque imediatamente</span>
                    </label>
                  </div>
                </div>

                {/* Observacoes */}
                <div className="col-span-2">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Notas da Execução</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(p => ({ ...p, observacoes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

              </div>

              {/* BTN SUBMIT */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="py-3 px-6 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-600/10 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Play size={16} />
                  Iniciar Ordem de Produção
                </button>
              </div>

            </form>
          </div>

          {/* Estimator Side Card (1/3 width) */}
          <div className="space-y-4">
            
            {/* REAL TIME COST ESTIMATE HEADER */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5" id="real-time-cost-card">
              <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider font-semibold mb-4">Estimativa Real de Custos</h4>
              
              {selectedProduct ? (
                <div className="space-y-4 font-mono text-xs">
                  <div className="space-y-2 text-neutral-300">
                    <div className="flex justify-between border-b border-neutral-800 pb-1">
                      <span>Nome do Item:</span>
                      <strong className="text-white text-right">{selectedProduct.nome}</strong>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800 pb-1">
                      <span>Massa Unitária:</span>
                      <strong className="text-white">
                        {selectedProduct.materials.reduce((acc, m) => acc + m.quantidadeGrams, 0)}g
                      </strong>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800 pb-1">
                      <span>Total de Lote (g):</span>
                      <strong className="text-white">
                        {selectedProduct.materials.reduce((acc, m) => acc + m.quantidadeGrams, 0) * formData.quantidade}g
                      </strong>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800 pb-1">
                      <span>Horas de Extrusão:</span>
                      <strong className="text-white">
                        {selectedProduct.tempoImpressao * formData.quantidade}h
                      </strong>
                    </div>
                  </div>

                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 space-y-2">
                    <div className="flex justify-between text-neutral-400">
                      <span>Filamentos:</span>
                      <span className="text-white">R$ {estFilamentCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Energia (kWh):</span>
                      <span className="text-white">R$ {estEnergyCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Mão de Obra:</span>
                      <span className="text-white">R$ {estLaborCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-800/80 pt-2 text-orange-400 font-bold">
                      <span>CUSTO TOTAL:</span>
                      <span className="text-orange-500 font-black">R$ {estTotalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Custo Unitário:</span>
                      <span>R$ {estUnitCost.toFixed(2)}</span>
                    </div>
                  </div>

                  {formData.status === 'Finalizada' && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900 rounded-lg text-[11px] text-emerald-400 flex items-start gap-1.5 leading-relaxed">
                      <Sparkles size={16} className="shrink-0 mt-0.5" />
                      <span>Ao concluir, o estoque do filamento sofrerá baixa imediata correspondente a {(selectedProduct.materials.reduce((acc, m) => acc + m.quantidadeGrams, 0) * formData.quantidade)}g.</span>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-12 text-center text-neutral-500 font-mono text-xs">
                  Selecione um produto acabado para projetar o faturamento de custos.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* --- SUBTAB: HISTÓRICO QUEUE (LISTING OF ORDERS) --- */}
      {activeTab === 'historico' && (
        <div className="space-y-4 animate-fade-in" id="historico-producao-wrapper">
          
          {/* SEARCH & FILTER BAR */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3" id="historico-filters">
            {/* Product Select */}
            <div>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
              >
                <option value="todos">Todos os Produtos</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            {/* Printer Select */}
            <div>
              <select
                value={filterPrinter}
                onChange={(e) => setFilterPrinter(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
              >
                <option value="todos">Todas as Impressoras</option>
                {printers.map(pr => (
                  <option key={pr.id} value={pr.id}>{pr.nome}</option>
                ))}
              </select>
            </div>

            {/* Operator Filter */}
            <div>
              <input
                type="text"
                value={filterOperator}
                onChange={(e) => setFilterOperator(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none"
              />
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
              />
            </div>
          </div>

          {/* QUEUE TABLE */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl" id="prod-queue-table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="prod-queue-table">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/20 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    <th className="py-4 px-4 font-semibold">Ordem No.</th>
                    <th className="py-4 px-4 font-semibold">Data</th>
                    <th className="py-4 px-4 font-semibold">Produto Acabado</th>
                    <th className="py-4 px-4 font-semibold text-right">Lote Produzido</th>
                    <th className="py-4 px-4 font-semibold">Impressora / Operador</th>
                    <th className="py-4 px-4 font-semibold text-right">Custo Unitário</th>
                    <th className="py-4 px-4 font-semibold text-right">Custo Total</th>
                    <th className="py-4 px-4 font-semibold text-center">Status</th>
                    <th className="py-4 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-300">
                  {filteredProductions.length > 0 ? (
                    // sort by date descending
                    [...filteredProductions].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(po => {
                      const prodObj = products.find(p => p.id === po.produtoId);
                      const printerObj = printers.find(p => p.id === po.impressoraId);

                      // calculate provisional rates if status is 'Em Produção'
                      let displayUnitCost = po.custoUnitario;
                      let displayTotalCost = po.custoTotal;

                      if (po.status === 'Em Produção' && prodObj && printerObj) {
                        const tempFilCost = prodObj.materials.reduce((acc, mat) => {
                          const maxRate = getMaxCostPerGram(mat.tipoFilamento);
                          return acc + (mat.quantidadeGrams * maxRate);
                        }, 0) * po.quantidade;

                        const tempEnergyCost = (printerObj.potenciaWatts * prodObj.tempoImpressao) / 1000 * currentTariff * po.quantidade;
                        const tempLaborCost = po.maoDeObraEscolha === 'unitario' ? po.maoDeObraValor * po.quantidade : po.maoDeObraValor;

                        displayTotalCost = tempFilCost + tempEnergyCost + tempLaborCost;
                        displayUnitCost = displayTotalCost / po.quantidade;
                      }

                      return (
                        <tr key={po.id} className="hover:bg-neutral-800/10 transition-colors" id={`row-production-order-${po.id}`}>
                          <td className="py-3.5 px-4 font-mono font-black text-white">
                            {po.numero}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap text-neutral-400">
                            {po.data}
                          </td>
                          <td className="py-3.5 px-4">
                            {prodObj ? (
                              <div className="flex flex-col">
                                <span className="text-white font-semibold">{prodObj.nome}</span>
                                <span className="text-xs text-neutral-500">{prodObj.categoria}</span>
                              </div>
                            ) : (
                              <span className="text-red-400 italic">Peça excluída</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                            {po.quantidade} <span className="text-xs font-normal text-neutral-400">un</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs">
                            <div className="text-neutral-200 font-semibold">{printerObj?.nome || 'Impressora Indefinida'}</div>
                            <div className="text-neutral-500">Operador: {po.operador}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-400">
                            R$ {displayUnitCost.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-orange-400">
                            R$ {displayTotalCost.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md ${
                              po.status === 'Finalizada' ? 'bg-emerald-950/60 border border-emerald-500/20 text-emerald-400' :
                              po.status === 'Em Produção' ? 'bg-blue-950/60 border border-blue-500/20 text-blue-400 animate-pulse' :
                              'bg-neutral-950 border border-neutral-800 text-neutral-500'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {po.status === 'Em Produção' ? (
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => handleFinalizeFromHistory(po)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded flex items-center gap-0.5 cursor-pointer"
                                  title="Finalizar e baixar estoque"
                                  id={`finalize-po-btn-${po.id}`}
                                >
                                  <CheckCircle size={10} /> Concluir
                                </button>
                                <button
                                  onClick={() => handleCancelFromHistory(po)}
                                  className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-neutral-500 hover:text-red-500 text-[10px] rounded flex items-center gap-0.5 cursor-pointer"
                                  title="Cancelar Ordem"
                                  id={`cancel-po-btn-${po.id}`}
                                >
                                  <XCircle size={10} /> Cancelar
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-neutral-500 italic">Auditado</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-neutral-500 font-mono text-xs">
                        Nenhuma ordem de produção cadastrada. Vá até "Nova Produção" para iniciar a fabricação.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- SUBTAB: RELATÓRIO FINANCEIRO / CUSTOS --- */}
      {activeTab === 'relatorios' && (
        <div className="space-y-6 animate-fade-in" id="relatorios-financeiros-wrapper">
          
          {/* SEARCH & FILTER CONTROLS FOR DYNAMIC RELATÓRIOS */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3" id="relatorio-filters">
            <div>
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Filtrar por Peça</label>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todas as Peças</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Filtrar por Impressora</label>
              <select
                value={filterPrinter}
                onChange={(e) => setFilterPrinter(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todas as Impressoras</option>
                {printers.map(pr => (
                  <option key={pr.id} value={pr.id}>{pr.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Data de Início</label>
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Data Final</label>
              <input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none"
              />
            </div>
          </div>

          {/* DYNAMIC METRICS BOARD */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="relatorios-indicators">
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <h4 className="text-[10px] font-mono uppercase text-neutral-400">Total Manufaturado</h4>
              <div className="text-xl font-black text-white mt-1">{repPiecesCount} <span className="text-xs font-normal text-neutral-400">peças</span></div>
              <p className="text-[10px] text-neutral-500 mt-1 font-mono">em {repProductions.length} ordens finalizadas</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <h4 className="text-[10px] font-mono uppercase text-neutral-400">Tempo de Extrusora Acumulado</h4>
              <div className="text-xl font-black text-white mt-1">{repTotalHours.toFixed(1)} <span className="text-xs font-normal text-neutral-400">horas</span></div>
              <p className="text-[10px] text-neutral-500 mt-1 font-mono">Consumo est. {repTotalKwh.toFixed(1)} kWh</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <h4 className="text-[10px] font-mono uppercase text-neutral-400">Insumos brutos gastos</h4>
              <div className="text-xl font-black text-white mt-1">R$ {repTotalFilamentCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-[10px] text-neutral-500 mt-1 font-mono">Custo filamento histórico</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 border-l-orange-500">
              <h4 className="text-[10px] font-mono uppercase text-orange-400 font-bold">Investimento de Fabricação</h4>
              <div className="text-xl font-black text-orange-500 mt-1">R$ {repTotalOverallCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-[10px] text-neutral-500 mt-1 font-mono">Filamento + Energia + Mão Obra</p>
            </div>

          </div>

          {/* DETAILED FINANCE ANALYSIS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="relatorios-breakdowns">
            
            {/* Breakdown 1: Filament Cost per Polymer */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5" id="rep-filament-breakdown">
              <h4 className="text-xs font-mono uppercase text-neutral-400 font-bold mb-3 border-b border-neutral-800 pb-2">Consumo por tipo de filamento</h4>
              <div className="space-y-3 font-mono text-xs">
                {['PLA', 'PETG', 'ABS', 'TPU'].map(tp => {
                  let totalG = 0;
                  let totalVal = 0;
                  
                  repProductions.forEach(po => {
                    const prodObj = products.find(p => p.id === po.produtoId);
                    if (!prodObj) return;
                    prodObj.materials.forEach(mat => {
                      if (mat.tipoFilamento === tp) {
                        const maxRate = getMaxCostPerGram(tp);
                        const weight = mat.quantidadeGrams * po.quantidade;
                        totalG += weight;
                        totalVal += weight * maxRate;
                      }
                    });
                  });

                  return (
                    <div key={tp} className="flex justify-between items-center text-neutral-300">
                      <div>
                        <span className="font-bold text-white">{tp}:</span>
                        <span className="text-neutral-500 text-[10px] ml-1.5">{totalG} g</span>
                      </div>
                      <span className="text-orange-400 font-bold">R$ {totalVal.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breakdown 2: Eletricity Cost */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5" id="rep-energy-breakdown">
              <h4 className="text-xs font-mono uppercase text-neutral-400 font-bold mb-3 border-b border-neutral-800 pb-2">Gasto energético por impressora</h4>
              <div className="space-y-3 font-mono text-xs text-neutral-300">
                {printers.map(pr => {
                  const runs = repProductions.filter(po => po.impressoraId === pr.id);
                  const totalHrs = runs.reduce((acc, po) => {
                    const prodObj = products.find(p => p.id === po.produtoId);
                    return acc + (prodObj ? prodObj.tempoImpressao * po.quantidade : 0);
                  }, 0);
                  const totalKwh = (pr.potenciaWatts * totalHrs) / 1000;
                  const totalValue = totalKwh * currentTariff;

                  return (
                    <div key={pr.id} className="flex justify-between items-center">
                      <div className="truncate max-w-[150px]">
                        <span className="text-white font-semibold">{pr.nome}:</span>
                        <span className="text-neutral-500 text-[10px] block font-light">{totalHrs.toFixed(1)}h • {totalKwh.toFixed(1)} kWh</span>
                      </div>
                      <span className="text-orange-400 font-bold">R$ {totalValue.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breakdown 3: Labor Subtotals */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5" id="rep-labor-breakdown">
              <h4 className="text-xs font-mono uppercase text-neutral-400 font-bold mb-3 border-b border-neutral-800 pb-2">Gastos com Mão de Obra e Médias</h4>
              <div className="space-y-4 font-mono text-xs text-neutral-300">
                <div className="flex justify-between">
                  <span>Mão de Obra Total:</span>
                  <strong className="text-white">R$ {repTotalLaborCost.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Custo Médio / Peça:</span>
                  <strong className="text-orange-500">
                    R$ {repPiecesCount > 0 ? (repTotalOverallCost / repPiecesCount).toFixed(2) : '0.00'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Custo Médio / Produção:</span>
                  <strong className="text-white">
                    R$ {repProductions.length > 0 ? (repTotalOverallCost / repProductions.length).toFixed(2) : '0.00'}
                  </strong>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
