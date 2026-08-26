import React, { useState } from 'react';
import { Product, BOMItem, FilamentType } from '../types';
import { Plus, Search, ClipboardList, DollarSign, Sliders, Trash2, Image as ImageIcon, FileText, ExternalLink, Paperclip, Upload, RotateCcw, Sparkles } from 'lucide-react';
import { useData } from '../hooks/useData';
import { DataList } from './ui/DataList';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';
import { Modal } from './ui/Modal';
import { activeEnergyRate, bomCost, calculateProductPricing, getGlobalPricingConfig } from '../utils/businessCalculations';

export default function Products() {
  const { useProdutos, useImpressoras, useFilamentos, useTarifas, useAddProduto, useUpdateProduto, useDeleteProduto } = useData();
  const { data: products = [] } = useProdutos();
  const { data: printers = [] } = useImpressoras();
  const { data: filaments = [] } = useFilamentos();
  const { data: tariffs = [] } = useTarifas();
  const addMutation = useAddProduto();
  const editMutation = useUpdateProduto();
  const deleteMutation = useDeleteProduto();
  const { toast, showToast, hideToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Decoração');
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState('');
  const [pdfProjeto, setPdfProjeto] = useState('');
  const [pdfProjetoNome, setPdfProjetoNome] = useState('');
  const [linkProjeto, setLinkProjeto] = useState('');
  const [tempoImpressao, setTempoImpressao] = useState(4); // hours
  const [impressoraPadraoId, setImpressoraPadraoId] = useState('');
  const [tempoAcabamento, setTempoAcabamento] = useState(0.5); // hours
  const [valorMaoDeObra, setValorMaoDeObra] = useState(30.00);
  const [outrasDespesas, setOutrasDespesas] = useState(0.00); // Embalagem, cola, parafusos, acessórios
  const [observacoes, setObservacoes] = useState('');
  
  // Pricing & Separated Margins (Margem % e Over %)
  const [marginPercentage, setMarginPercentage] = useState(100); // % Profit Margin
  const [overPercent, setOverPercent] = useState(0); // % Overhead / Extra
  const [precoVenda, setPrecoVenda] = useState(0); // Selling price in R$
  const [isCustomPriceManual, setIsCustomPriceManual] = useState(false);

  // Custom product overrides flags
  const [hasCustomMargemLucro, setHasCustomMargemLucro] = useState(false);
  const [hasCustomMaoDeObra, setHasCustomMaoDeObra] = useState(false);
  const [hasCustomOutrasDespesas, setHasCustomOutrasDespesas] = useState(false);

  // BOM items list in the form
  const [formMaterials, setFormMaterials] = useState<BOMItem[]>([
    { tipoFilamento: 'PLA', filamentoId: 'any', quantidadeGrams: 100 }
  ]);

  // Active energy tariff
  const currentTariff = activeEnergyRate(tariffs);

  // Helper to calculate BOM costs safely for UI
  const calculateBOMCost = (materials?: BOMItem[]) => bomCost(materials, filaments);

  const calculateEnergyCost = (tempo: number, printerId: string): number => {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return 0;
    const consumptionKwh = (printer.potenciaWatts * tempo) / 1000;
    return consumptionKwh * currentTariff;
  };

  // Helper for centralized calculation using current state
  const getCurrentPricing = (customMargem?: number, customOver?: number, customMao?: number, customOutras?: number, customMat?: BOMItem[], customTempo?: number, customPrinter?: string) => {
    return calculateProductPricing({
      materials: customMat ?? formMaterials,
      filaments,
      tempoImpressao: customTempo ?? tempoImpressao,
      impressoraPadraoId: customPrinter ?? impressoraPadraoId,
      printers,
      tariffs,
      margemLucro: customMargem !== undefined ? customMargem : marginPercentage,
      outrasDespesas: customOutras !== undefined ? customOutras : outrasDespesas,
      valorMaoDeObra: customMao !== undefined ? customMao : valorMaoDeObra,
      overPercent: customOver !== undefined ? customOver : overPercent,
      hasCustomMargemLucro,
      hasCustomMaoDeObra,
      hasCustomOutrasDespesas
    });
  };

  const currentCalc = getCurrentPricing();
  const costBOM = currentCalc.costBOM;
  const costEnergy = currentCalc.costEnergy;
  const costTotal = currentCalc.costTotal;

  // Dynamic price & margin handlers
  const handleMarginChange = (newMargin: number) => {
    setMarginPercentage(newMargin);
    const calc = getCurrentPricing(newMargin, overPercent);
    setPrecoVenda(calc.suggestedPrice);
    setIsCustomPriceManual(false);
  };

  const handleOverChange = (newOver: number) => {
    setOverPercent(newOver);
    const calc = getCurrentPricing(marginPercentage, newOver);
    setPrecoVenda(calc.suggestedPrice);
    setIsCustomPriceManual(false);
  };

  const handlePriceChange = (newPrice: number) => {
    setPrecoVenda(newPrice);
    const calc = getCurrentPricing(marginPercentage, overPercent);
    const diff = newPrice - calc.costTotal;
    const totalMarkup = calc.costTotal > 0 ? (diff / calc.costTotal) * 100 : 0;
    const newMargin = Math.max(0, totalMarkup - overPercent);
    setMarginPercentage(newMargin);
    setIsCustomPriceManual(true);
  };

  // Local File Readers for Image & PDF
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ser menor que 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagem(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('O arquivo PDF deve ter até 10MB.', 'error');
      return;
    }
    setPdfProjetoNome(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPdfProjeto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = () => {
    const globalCfg = getGlobalPricingConfig();
    setEditingProduct(null);
    setNome('');
    setCategoria('Decoração');
    setDescricao('');
    setImagem('');
    setPdfProjeto('');
    setPdfProjetoNome('');
    setLinkProjeto('');
    setTempoImpressao(4);
    const defaultPrinter = printers.length > 0 ? printers[0].id : '';
    setImpressoraPadraoId(defaultPrinter);
    setTempoAcabamento(0.5);
    setValorMaoDeObra(globalCfg.valorMaoDeObraPadrao);
    setOutrasDespesas(globalCfg.outrasDespesasPadrao);
    setMarginPercentage(globalCfg.margemLucroPadrao);
    setHasCustomMargemLucro(false);
    setHasCustomMaoDeObra(false);
    setHasCustomOutrasDespesas(false);
    setObservacoes('');
    
    const defaultMaterials = [{ tipoFilamento: 'PLA' as FilamentType, filamentoId: 'any', quantidadeGrams: 100 }];
    setFormMaterials(defaultMaterials);
    setOverPercent(0);

    const calc = calculateProductPricing({
      materials: defaultMaterials,
      filaments,
      tempoImpressao: 4,
      impressoraPadraoId: defaultPrinter,
      printers,
      tariffs,
      margemLucro: globalCfg.margemLucroPadrao,
      outrasDespesas: globalCfg.outrasDespesasPadrao,
      valorMaoDeObra: globalCfg.valorMaoDeObraPadrao,
      overPercent: 0,
      hasCustomMargemLucro: false,
      hasCustomMaoDeObra: false,
      hasCustomOutrasDespesas: false,
      globalConfig: globalCfg
    });
    
    setPrecoVenda(calc.suggestedPrice);
    setIsCustomPriceManual(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    const globalCfg = getGlobalPricingConfig();
    setEditingProduct(p);
    setNome(p.nome);
    setCategoria(p.categoria);
    setDescricao(p.descricao || '');
    setImagem(p.imagem || '');
    setPdfProjeto(p.pdfProjeto || '');
    setPdfProjetoNome(p.pdfProjetoNome || '');
    setLinkProjeto(p.linkProjeto || '');
    setTempoImpressao(p.tempoImpressao);
    setImpressoraPadraoId(p.impressoraPadraoId);
    setTempoAcabamento(p.tempoAcabamento || 0);
    
    const customMargem = Boolean(p.hasCustomMargemLucro);
    const customMao = Boolean(p.hasCustomMaoDeObra);
    const customOutras = Boolean(p.hasCustomOutrasDespesas);

    setHasCustomMargemLucro(customMargem);
    setHasCustomMaoDeObra(customMao);
    setHasCustomOutrasDespesas(customOutras);

    const loadedMargin = customMargem && p.margemLucro !== undefined ? p.margemLucro : globalCfg.margemLucroPadrao;
    const loadedMao = customMao ? p.valorMaoDeObra : globalCfg.valorMaoDeObraPadrao;
    const loadedOutras = customOutras && p.outrasDespesas !== undefined ? p.outrasDespesas : globalCfg.outrasDespesasPadrao;
    const loadedOver = p.overPercent !== undefined ? p.overPercent : 0;

    setMarginPercentage(loadedMargin);
    setValorMaoDeObra(loadedMao);
    setOutrasDespesas(loadedOutras);
    setOverPercent(loadedOver);
    setObservacoes(p.observacoes || '');
    
    const mats = Array.isArray(p.materials) && p.materials.length > 0 
      ? p.materials.map(m => ({ ...m })) 
      : [{ tipoFilamento: 'PLA' as FilamentType, filamentoId: 'any', quantidadeGrams: 100 }];
    setFormMaterials(mats);

    const calc = calculateProductPricing({
      materials: mats,
      filaments,
      tempoImpressao: p.tempoImpressao,
      impressoraPadraoId: p.impressoraPadraoId,
      printers,
      tariffs,
      margemLucro: loadedMargin,
      outrasDespesas: loadedOutras,
      valorMaoDeObra: loadedMao,
      overPercent: loadedOver,
      hasCustomMargemLucro: customMargem,
      hasCustomMaoDeObra: customMao,
      hasCustomOutrasDespesas: customOutras,
      globalConfig: globalCfg
    });

    const isExplicitlyManual = Boolean(p.precoVenda && p.precoVenda > 0 && Math.abs(p.precoVenda - calc.suggestedPrice) > 0.05);
    if (p.precoVenda && p.precoVenda > 0) {
      setPrecoVenda(p.precoVenda);
      setIsCustomPriceManual(isExplicitlyManual);
    } else {
      setPrecoVenda(calc.suggestedPrice);
      setIsCustomPriceManual(false);
    }
    setIsModalOpen(true);
  };

  const handleUseGlobalDefaults = () => {
    const globalCfg = getGlobalPricingConfig();
    setMarginPercentage(globalCfg.margemLucroPadrao);
    setValorMaoDeObra(globalCfg.valorMaoDeObraPadrao);
    setOutrasDespesas(globalCfg.outrasDespesasPadrao);
    setHasCustomMargemLucro(false);
    setHasCustomMaoDeObra(false);
    setHasCustomOutrasDespesas(false);
    setIsCustomPriceManual(false);

    const calc = calculateProductPricing({
      materials: formMaterials,
      filaments,
      tempoImpressao,
      impressoraPadraoId,
      printers,
      tariffs,
      margemLucro: globalCfg.margemLucroPadrao,
      outrasDespesas: globalCfg.outrasDespesasPadrao,
      valorMaoDeObra: globalCfg.valorMaoDeObraPadrao,
      overPercent,
      hasCustomMargemLucro: false,
      hasCustomMaoDeObra: false,
      hasCustomOutrasDespesas: false,
      globalConfig: globalCfg
    });
    setPrecoVenda(calc.suggestedPrice);
    showToast('Configurações herdadas do padrão global do sistema com sucesso!', 'info');
  };

  const handleRecalculateSingleProduct = () => {
    const globalCfg = getGlobalPricingConfig();
    const calc = calculateProductPricing({
      materials: formMaterials,
      filaments,
      tempoImpressao,
      impressoraPadraoId,
      printers,
      tariffs,
      margemLucro: hasCustomMargemLucro ? marginPercentage : globalCfg.margemLucroPadrao,
      outrasDespesas: hasCustomOutrasDespesas ? outrasDespesas : globalCfg.outrasDespesasPadrao,
      valorMaoDeObra: hasCustomMaoDeObra ? valorMaoDeObra : globalCfg.valorMaoDeObraPadrao,
      overPercent,
      hasCustomMargemLucro,
      hasCustomMaoDeObra,
      hasCustomOutrasDespesas,
      globalConfig: globalCfg
    });

    setPrecoVenda(calc.suggestedPrice);
    setIsCustomPriceManual(false);
    showToast(`Preço recalculado: R$ ${calc.suggestedPrice.toFixed(2)}`, 'success');
  };

  const handleAddBOMItem = () => {
    const list = [...formMaterials, { tipoFilamento: 'PLA' as FilamentType, filamentoId: 'any', quantidadeGrams: 50 }];
    setFormMaterials(list);
    if (!isCustomPriceManual) {
      const calc = calculateProductPricing({
        materials: list,
        filaments,
        tempoImpressao,
        impressoraPadraoId,
        printers,
        tariffs,
        margemLucro: marginPercentage,
        outrasDespesas,
        valorMaoDeObra,
        overPercent,
        hasCustomMargemLucro,
        hasCustomMaoDeObra,
        hasCustomOutrasDespesas
      });
      setPrecoVenda(calc.suggestedPrice);
    }
  };

  const handleRemoveBOMItem = (index: number) => {
    if (formMaterials.length === 1) return;
    const list = formMaterials.filter((_, idx) => idx !== index);
    setFormMaterials(list);
    if (!isCustomPriceManual) {
      const calc = calculateProductPricing({
        materials: list,
        filaments,
        tempoImpressao,
        impressoraPadraoId,
        printers,
        tariffs,
        margemLucro: marginPercentage,
        outrasDespesas,
        valorMaoDeObra,
        overPercent,
        hasCustomMargemLucro,
        hasCustomMaoDeObra,
        hasCustomOutrasDespesas
      });
      setPrecoVenda(calc.suggestedPrice);
    }
  };

  const handleBOMChange = (index: number, key: keyof BOMItem, value: any) => {
    const list = [...formMaterials];
    if (key === 'tipoFilamento') {
      list[index].tipoFilamento = value as FilamentType;
      list[index].filamentoId = 'any';
    } else if (key === 'filamentoId') {
      list[index].filamentoId = value;
    } else if (key === 'quantidadeGrams') {
      list[index].quantidadeGrams = Number(value);
    }
    setFormMaterials(list);
    if (!isCustomPriceManual) {
      const calc = calculateProductPricing({
        materials: list,
        filaments,
        tempoImpressao,
        impressoraPadraoId,
        printers,
        tariffs,
        margemLucro: marginPercentage,
        outrasDespesas,
        valorMaoDeObra,
        overPercent,
        hasCustomMargemLucro,
        hasCustomMaoDeObra,
        hasCustomOutrasDespesas
      });
      setPrecoVenda(calc.suggestedPrice);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !categoria || !impressoraPadraoId || formMaterials.length === 0) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const productData: Omit<Product, 'id'> = {
      nome,
      categoria,
      descricao,
      imagem,
      pdfProjeto,
      pdfProjetoNome,
      linkProjeto,
      tempoImpressao: Number(tempoImpressao),
      impressoraPadraoId,
      materials: formMaterials,
      tempoAcabamento: Number(tempoAcabamento),
      valorMaoDeObra: Number(valorMaoDeObra),
      outrasDespesas: Number(outrasDespesas),
      margemLucro: Number(marginPercentage),
      overPercent: Number(overPercent),
      precoVenda: Number(precoVenda),
      hasCustomMargemLucro,
      hasCustomMaoDeObra,
      hasCustomOutrasDespesas,
      observacoes
    };

    const onSuccess = () => {
      setIsModalOpen(false);
      showToast(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!', 'success');
    };
    const onError = (err: any) => showToast(`Erro ao salvar produto: ${err?.message || 'Tente novamente.'}`, 'error');

    if (editingProduct) {
      editMutation.mutate({ ...productData, id: editingProduct.id }, { onSuccess, onError });
    } else {
      addMutation.mutate(productData, { onSuccess, onError });
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDialog({ open: true, id, name });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(confirmDialog.id, {
      onSuccess: () => showToast('Produto excluído com sucesso.', 'warning'),
      onError: () => showToast('Erro ao excluir produto.', 'error')
    });
    setConfirmDialog({ open: false, id: '', name: '' });
  };

  // Filtered Products Search Computation
  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.nome && p.nome.toLowerCase().includes(q)) ||
      (p.categoria && p.categoria.toLowerCase().includes(q)) ||
      (p.descricao && p.descricao.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6" id="products-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
      <ConfirmDialog
        open={confirmDialog.open}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${confirmDialog.name}"? Ordens de produção associadas perderão o vínculo.`}
        confirmLabel="Excluir Produto"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: '', name: '' })}
      />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="products-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Cadastro de Peças e Ficha Técnica (BOM)</h2>
          <p className="text-sm text-neutral-400 mt-1">Configure o catálogo de produtos e estruture os custos detalhados por polímero, eletricidade das impressoras e mão de obra.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={printers.length === 0 || filaments.length === 0}
          id="add-new-product-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Cadastrar Peça (Ficha Técnica)
        </button>
      </div>

      {(printers.length === 0 || filaments.length === 0) && (
        <div className="p-4 bg-amber-950/40 border border-amber-800 text-amber-200 text-sm rounded-xl" id="product-warnings-box">
          ⚠️ <strong>Atenção:</strong> Você precisa ter pelo menos uma impressora cadastrada em <strong>Impressoras</strong> e filamentos em <strong>Filamentos</strong> para conseguir montar fichas técnicas (BOM).
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="relative" id="products-search-bar">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar peça por nome, categoria ou descrição..."
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
          aria-label="Pesquisar produtos"
        />
      </div>

      {/* PRODUCT LIST */}
      <DataList<Product>
        data={filteredProducts}
        rowKey={(p) => p.id}
        columns={[
          {
            key: 'nome',
            header: 'Produto / Categoria',
            render: (p) => (
              <div className="flex items-center gap-3">
                {p.imagem ? (
                  <img src={p.imagem} alt={p.nome} className="w-10 h-10 rounded-lg object-cover border border-neutral-800 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-500 shrink-0">
                    <ImageIcon size={18} />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-white block">{p.nome}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider">{p.categoria}</span>
                    {p.linkProjeto && (
                      <a href={p.linkProjeto} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 flex items-center gap-0.5 text-[10px]" title="Abrir Link do Projeto">
                        <ExternalLink size={10} /> Link
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'tempo',
            header: 'Tempo',
            align: 'right',
            render: (p) => (
              <span className="font-mono text-neutral-300 text-sm">
                {p.tempoImpressao}h
                {p.tempoAcabamento ? <span className="text-neutral-500"> +{p.tempoAcabamento}h</span> : null}
              </span>
            ),
          },
          {
            key: 'custo',
            header: 'Custo Total',
            align: 'right',
            render: (p) => {
              const calc = calculateProductPricing({
                materials: p.materials,
                filaments,
                tempoImpressao: p.tempoImpressao,
                impressoraPadraoId: p.impressoraPadraoId,
                printers,
                tariffs,
                margemLucro: p.margemLucro,
                outrasDespesas: p.outrasDespesas,
                valorMaoDeObra: p.valorMaoDeObra,
                overPercent: p.overPercent,
                hasCustomMargemLucro: p.hasCustomMargemLucro,
                hasCustomMaoDeObra: p.hasCustomMaoDeObra,
                hasCustomOutrasDespesas: p.hasCustomOutrasDespesas
              });
              return <span className="font-mono font-semibold text-white">R$ {calc.costTotal.toFixed(2)}</span>;
            },
          },
          {
            key: 'preco',
            header: 'Preço Sugerido / Venda',
            align: 'right',
            render: (p) => {
              const calc = calculateProductPricing({
                materials: p.materials,
                filaments,
                tempoImpressao: p.tempoImpressao,
                impressoraPadraoId: p.impressoraPadraoId,
                printers,
                tariffs,
                margemLucro: p.margemLucro,
                outrasDespesas: p.outrasDespesas,
                valorMaoDeObra: p.valorMaoDeObra,
                overPercent: p.overPercent,
                hasCustomMargemLucro: p.hasCustomMargemLucro,
                hasCustomMaoDeObra: p.hasCustomMaoDeObra,
                hasCustomOutrasDespesas: p.hasCustomOutrasDespesas
              });
              const finalPrice = (p.precoVenda && p.precoVenda > 0) ? p.precoVenda : calc.suggestedPrice;
              const marginPct = p.margemLucro !== undefined ? p.margemLucro : 100;
              const overPct = p.overPercent !== undefined ? p.overPercent : 0;

              return (
                <div className="text-right">
                  <span className="font-mono font-bold text-orange-400 block text-sm">
                    R$ {finalPrice.toFixed(2)}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500 block">
                    Margem: {marginPct.toFixed(0)}% | Over: {overPct.toFixed(0)}%
                  </span>
                </div>
              );
            },
          },
        ]}
        extraColumns={[
          {
            key: 'descricao',
            header: 'Descrição',
            render: (p) => <span className="text-neutral-300">{p.descricao || <span className="italic text-neutral-600">—</span>}</span>,
          },
          {
            key: 'impressora',
            header: 'Impressora Padrão',
            render: (p) => <span className="text-neutral-300">{printers.find(pr => pr.id === p.impressoraPadraoId)?.nome || '—'}</span>,
          },
          {
            key: 'insumos',
            header: 'Custo Insumos',
            render: (p) => <span className="text-neutral-300 font-mono">R$ {calculateBOMCost(p.materials).toFixed(2)}</span>,
          },
          {
            key: 'energia',
            header: 'Custo Energia',
            render: (p) => <span className="text-neutral-300 font-mono">R$ {calculateEnergyCost(p.tempoImpressao, p.impressoraPadraoId).toFixed(2)}</span>,
          },
          {
            key: 'mao_obra',
            header: 'Mão de Obra',
            render: (p) => <span className="text-neutral-300 font-mono">R$ {p.valorMaoDeObra.toFixed(2)}</span>,
          },
          {
            key: 'outras_despesas',
            header: 'Outras Despesas (Insumos Secundários)',
            render: (p) => <span className="text-neutral-300 font-mono">R$ {(p.outrasDespesas || 0).toFixed(2)}</span>,
          },
          {
            key: 'bom',
            header: 'Materiais (BOM)',
            render: (p) => {
              const mats = Array.isArray(p.materials) ? p.materials : [];
              return (
                <span className="text-neutral-300">
                  {mats.length > 0 ? mats.map((m, i) => `${m.quantidadeGrams}g ${m.tipoFilamento}`).join(' · ') : 'Sem insumos'}
                </span>
              );
            },
          },
          {
            key: 'projeto_anexos',
            header: 'Anexos & Links do Projeto',
            render: (p) => (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {p.pdfProjeto ? (
                  <a
                    href={p.pdfProjeto}
                    download={p.pdfProjetoNome || `${p.nome}_projeto.pdf`}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 rounded-lg flex items-center gap-1.5 font-mono text-[11px]"
                  >
                    <FileText size={13} className="text-red-400" />
                    <span>{p.pdfProjetoNome || 'Baixar PDF Projeto'}</span>
                  </a>
                ) : <span className="text-neutral-600 text-xs italic">Nenhum PDF anexo</span>}

                {p.linkProjeto && (
                  <a
                    href={p.linkProjeto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-orange-950/40 hover:bg-orange-900/50 text-orange-300 border border-orange-500/30 rounded-lg flex items-center gap-1.5 font-mono text-[11px]"
                  >
                    <ExternalLink size={13} />
                    <span>Ver no Site</span>
                  </a>
                )}
              </div>
            ),
          },
        ]}
        onEdit={handleOpenEditModal}
        onDelete={(p) => handleDelete(p.id, p.nome)}
        emptyMessage={searchQuery ? 'Nenhuma peça encontrada para a pesquisa.' : 'Nenhuma peça cadastrada ainda.'}
      />

      {/* PRODUCT / BOM DIALOG FORM MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="5xl"
        title={
          <span className="flex items-center gap-2">
            <ClipboardList size={20} className="text-orange-500" />
            {editingProduct ? 'Editar Ficha Técnica do Produto' : 'Cadastrar Peça & Ficha Técnica (BOM)'}
          </span>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={(e) => {
                const formEl = document.getElementById('product-form-element') as HTMLFormElement;
                if (formEl) formEl.requestSubmit();
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-orange-600/20"
            >
              Salvar Peça & Ficha Técnica
            </button>
          </>
        }
      >
        <form id="product-form-element" onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* IMAGE & MAIN FIELDS ROW */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2">
              <ImageIcon size={14} className="text-orange-500" /> Imagem & Identificação da Peça
            </h4>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Image selector */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-24 h-24 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden group">
                  {imagem ? (
                    <>
                      <img src={imagem} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImagem('')}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                      >
                        Remover
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <ImageIcon size={24} className="mx-auto text-neutral-600 mb-1" />
                      <span className="text-[9px] text-neutral-500 block">Sem foto</span>
                    </div>
                  )}
                </div>
                <label className="py-1 px-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[10px] font-bold rounded-lg cursor-pointer border border-neutral-700 flex items-center gap-1">
                  <Upload size={10} /> {imagem ? 'Alterar Foto' : 'Escolher Foto'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              {/* Product Name & Category */}
              <div className="flex-1 space-y-3 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-[11px]">Nome da Peça / Produto *</label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Suporte de Headset RGB"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-[11px]">Categoria *</label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="Decoração">Decoração</option>
                      <option value="Escritório">Escritório</option>
                      <option value="Colecionáveis">Colecionáveis</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Brindes">Brindes</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-[11px]">Descrição Detalhada do Produto</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={2}
                    placeholder="Descrição para catálogo, especificações técnicas ou manual de instalação..."
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ATTACHMENTS & LINKS ROW */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2">
              <Paperclip size={14} className="text-orange-500" /> Anexos & Arquivos do Projeto (3D / G-Code / PDF)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-[11px]">Manual / Desenho Técnico (PDF)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg cursor-pointer flex items-center justify-between text-neutral-300 transition-colors">
                    <span className="truncate text-xs font-mono">
                      {pdfProjetoNome ? `📄 ${pdfProjetoNome}` : 'Selecionar arquivo PDF...'}
                    </span>
                    <Upload size={14} className="text-orange-500 shrink-0 ml-2" />
                    <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                  </label>
                  {pdfProjeto && (
                    <button
                      type="button"
                      onClick={() => { setPdfProjeto(''); setPdfProjetoNome(''); }}
                      className="px-2 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-red-400 rounded-lg text-xs font-mono"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-[11px]">Link Externo do Modelo (Thingiverse / Printables)</label>
                <input
                  type="url"
                  value={linkProjeto}
                  onChange={(e) => setLinkProjeto(e.target.value)}
                  placeholder="https://www.printables.com/model/..."
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* PARAMETROS DE FABRICAÇÃO E MANUFATURA */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2">
              <Sliders size={14} className="text-orange-500" /> Parâmetros Técnicos de Impressão & Acabamento
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-[11px] min-h-[28px] flex items-end">Tempo Impressão (h) *</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0.1"
                  value={tempoImpressao}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTempoImpressao(val);
                    if (!isCustomPriceManual) {
                      const calc = calculateProductPricing({
                        materials: formMaterials,
                        filaments,
                        tempoImpressao: val,
                        impressoraPadraoId,
                        printers,
                        tariffs,
                        margemLucro: marginPercentage,
                        outrasDespesas,
                        valorMaoDeObra,
                        overPercent,
                        hasCustomMargemLucro,
                        hasCustomMaoDeObra,
                        hasCustomOutrasDespesas
                      });
                      setPrecoVenda(calc.suggestedPrice);
                    }
                  }}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-[11px] min-h-[28px] flex items-end">Impressora Padrão *</label>
                <select
                  value={impressoraPadraoId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setImpressoraPadraoId(pid);
                    if (!isCustomPriceManual) {
                      const calc = calculateProductPricing({
                        materials: formMaterials,
                        filaments,
                        tempoImpressao,
                        impressoraPadraoId: pid,
                        printers,
                        tariffs,
                        margemLucro: marginPercentage,
                        outrasDespesas,
                        valorMaoDeObra,
                        overPercent,
                        hasCustomMargemLucro,
                        hasCustomMaoDeObra,
                        hasCustomOutrasDespesas
                      });
                      setPrecoVenda(calc.suggestedPrice);
                    }
                  }}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {printers.map(pr => (
                    <option key={pr.id} value={pr.id}>
                      {pr.nome} ({pr.potenciaWatts}W)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-[11px] min-h-[28px] flex items-end">Acabamento (h)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={tempoAcabamento}
                  onChange={(e) => setTempoAcabamento(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1 min-h-[28px] overflow-hidden">
                  <label className="text-neutral-400 uppercase tracking-wider font-semibold text-[11px] whitespace-nowrap truncate">Mão de Obra (R$) *</label>
                  {hasCustomMaoDeObra ? (
                    <span className="text-[8px] px-1 bg-amber-950 text-amber-400 rounded flex-shrink-0">Exceção</span>
                  ) : (
                    <span className="text-[8px] px-1 bg-neutral-800 text-neutral-400 rounded flex-shrink-0">Global</span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  step="0.5"
                  min="0"
                  value={valorMaoDeObra}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setValorMaoDeObra(val);
                    setHasCustomMaoDeObra(true);
                    if (!isCustomPriceManual) {
                      const calc = calculateProductPricing({
                        materials: formMaterials,
                        filaments,
                        tempoImpressao,
                        impressoraPadraoId,
                        printers,
                        tariffs,
                        margemLucro: marginPercentage,
                        outrasDespesas,
                        valorMaoDeObra: val,
                        overPercent,
                        hasCustomMargemLucro,
                        hasCustomMaoDeObra: true,
                        hasCustomOutrasDespesas
                      });
                      setPrecoVenda(calc.suggestedPrice);
                    }
                  }}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1 min-h-[28px] overflow-hidden">
                  <label className="text-neutral-400 uppercase tracking-wider font-semibold text-[11px] whitespace-nowrap truncate">Desp. Extras (R$)</label>
                  {hasCustomOutrasDespesas ? (
                    <span className="text-[8px] px-1 bg-amber-950 text-amber-400 rounded flex-shrink-0">Exceção</span>
                  ) : (
                    <span className="text-[8px] px-1 bg-neutral-800 text-neutral-400 rounded flex-shrink-0">Global</span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={outrasDespesas}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setOutrasDespesas(val);
                    setHasCustomOutrasDespesas(true);
                    if (!isCustomPriceManual) {
                      const calc = calculateProductPricing({
                        materials: formMaterials,
                        filaments,
                        tempoImpressao,
                        impressoraPadraoId,
                        printers,
                        tariffs,
                        margemLucro: marginPercentage,
                        outrasDespesas: val,
                        valorMaoDeObra,
                        overPercent,
                        hasCustomMargemLucro,
                        hasCustomMaoDeObra,
                        hasCustomOutrasDespesas: true
                      });
                      setPrecoVenda(calc.suggestedPrice);
                    }
                  }}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* COMPOSITION BOM TABLE */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-orange-500" /> Lista de Insumos & Polímeros (BOM)
              </h4>
              <button
                type="button"
                onClick={handleAddBOMItem}
                className="py-1 px-3 bg-neutral-900 hover:bg-neutral-850 text-orange-400 border border-neutral-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                + Adicionar Material
              </button>
            </div>

            {formMaterials.map((item, index) => {
              const availableTypeFilaments = filaments.filter(f => f.tipo === item.tipoFilamento);

              return (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1.2fr_1.8fr_1fr_auto] gap-3 items-end bg-neutral-900 p-3 rounded-lg border border-neutral-850 relative">
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider text-[10px]">Polímero *</label>
                    <select
                      value={item.tipoFilamento}
                      onChange={(e) => handleBOMChange(index, 'tipoFilamento', e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white text-[11px] focus:outline-none"
                    >
                      <option value="PLA">PLA</option>
                      <option value="PETG">PETG</option>
                      <option value="ABS">ABS</option>
                      <option value="TPU">TPU</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider text-[10px]">Bobina Específica (Opcional)</label>
                    <select
                      value={item.filamentoId || 'any'}
                      onChange={(e) => handleBOMChange(index, 'filamentoId', e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white text-[11px] focus:outline-none cursor-pointer"
                    >
                      <option value="any">Qualquer bobina {item.tipoFilamento} (Custo Padrão)</option>
                      {availableTypeFilaments.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.nome} - {f.cor} ({f.quantidadeDisponivel}g disp.)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider text-[10px]">Massa (g) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={item.quantidadeGrams}
                      onChange={(e) => handleBOMChange(index, 'quantidadeGrams', e.target.value)}
                      className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white text-[11px] focus:outline-none"
                    />
                  </div>

                  <div>
                    {formMaterials.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveBOMItem(index)}
                        className="text-red-500 hover:text-red-400 p-1.5 bg-neutral-950 rounded border border-neutral-850 cursor-pointer"
                        title="Remover Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <div className="w-7" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* REAL-TIME COST SUMMARY & MARGINS */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900 pb-2">
              <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} /> Detalhamento de Custos, Margem & Over
              </h4>
              
              <div className="flex items-center gap-2">
                {(hasCustomMargemLucro || hasCustomMaoDeObra || hasCustomOutrasDespesas) && (
                  <button
                    type="button"
                    onClick={handleUseGlobalDefaults}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw size={12} />
                    Usar Configuração Padrão
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRecalculateSingleProduct}
                  className="px-2.5 py-1 bg-orange-950/60 hover:bg-orange-900/60 text-orange-300 border border-orange-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles size={12} />
                  Recalcular Preço
                </button>
              </div>
            </div>

            {(() => {
              const calcSummary = calculateProductPricing({
                materials: formMaterials,
                filaments,
                tempoImpressao,
                impressoraPadraoId,
                printers,
                tariffs,
                margemLucro: marginPercentage,
                outrasDespesas,
                valorMaoDeObra,
                overPercent,
                hasCustomMargemLucro,
                hasCustomMaoDeObra,
                hasCustomOutrasDespesas
              });

              return (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                  <div className="bg-neutral-900 p-2 rounded border border-neutral-850">
                    <span className="text-neutral-500 uppercase text-[9px] block">Insumos (BOM)</span>
                    <strong className="text-white text-xs">R$ {calcSummary.costBOM.toFixed(2)}</strong>
                  </div>

                  <div className="bg-neutral-900 p-2 rounded border border-neutral-850">
                    <span className="text-neutral-500 uppercase text-[9px] block">Energia</span>
                    <strong className="text-white text-xs">R$ {calcSummary.costEnergy.toFixed(2)}</strong>
                  </div>

                  <div className="bg-neutral-900 p-2 rounded border border-neutral-850">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 uppercase text-[9px]">Mão de Obra</span>
                      {hasCustomMaoDeObra ? (
                        <span className="text-[8px] px-1 bg-amber-950 text-amber-400 rounded">Exceção</span>
                      ) : (
                        <span className="text-[8px] px-1 bg-neutral-800 text-neutral-400 rounded">Global</span>
                      )}
                    </div>
                    <strong className="text-white text-xs">R$ {calcSummary.valorMaoDeObra.toFixed(2)}</strong>
                    {calcSummary.isMaoDeObraCapped && (
                      <span className="text-[8px] text-amber-400 block mt-0.5" title="Limitado a no máximo 50% do custo do produto sem mão de obra">
                        ⚠️ Máx 50% Custo Base
                      </span>
                    )}
                  </div>

                  <div className="bg-neutral-900 p-2 rounded border border-neutral-850">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 uppercase text-[9px]">Outras Despesas</span>
                      {hasCustomOutrasDespesas ? (
                        <span className="text-[8px] px-1 bg-amber-950 text-amber-400 rounded">Exceção</span>
                      ) : (
                        <span className="text-[8px] px-1 bg-neutral-800 text-neutral-400 rounded">Global</span>
                      )}
                    </div>
                    <strong className="text-white text-xs">R$ {calcSummary.outrasDespesas.toFixed(2)}</strong>
                  </div>

                  <div className="bg-neutral-900 p-2 rounded border border-neutral-850 col-span-2 sm:col-span-1">
                    <span className="text-orange-400 uppercase text-[9px] font-bold block">Custo Total</span>
                    <strong className="text-orange-400 text-sm font-bold">R$ {calcSummary.costTotal.toFixed(2)}</strong>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-neutral-400 text-[10px] uppercase tracking-wider font-semibold">
                    Margem de Lucro %
                  </label>
                  {hasCustomMargemLucro ? (
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-950 border border-amber-500/30 text-amber-300 rounded font-mono font-bold">
                      Exceção
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 bg-neutral-950 border border-neutral-800 text-neutral-500 rounded font-mono">
                      Padrão Global
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={Number(marginPercentage.toFixed(1))}
                    onChange={(e) => {
                      setHasCustomMargemLucro(true);
                      handleMarginChange(Number(e.target.value));
                    }}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white font-mono text-xs focus:outline-none focus:border-orange-500 font-bold"
                  />
                  <span className="text-neutral-400 font-mono text-xs">%</span>
                </div>
                <span className="text-[9px] text-neutral-500 block mt-1">
                  Lucro líquido: R$ {(costTotal * (marginPercentage / 100)).toFixed(2)}
                </span>
              </div>

              <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                <label className="block text-neutral-400 text-[10px] uppercase tracking-wider font-semibold mb-1">
                  Over / Custos Extras %
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={Number(overPercent.toFixed(1))}
                    onChange={(e) => handleOverChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white font-mono text-xs focus:outline-none focus:border-orange-500 font-bold"
                  />
                  <span className="text-neutral-400 font-mono text-xs">%</span>
                </div>
                <span className="text-[9px] text-neutral-500 block mt-1">
                  Valor Over: R$ {(costTotal * (overPercent / 100)).toFixed(2)}
                </span>
              </div>

              <div className="bg-neutral-900 p-3 rounded-lg border border-orange-500/30 shadow-inner">
                <label className="block text-orange-400 text-[10px] uppercase tracking-wider font-bold mb-1">
                  Preço Final Sugerido (R$) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 font-mono font-bold text-xs">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={Number(precoVenda.toFixed(2))}
                    onChange={(e) => handlePriceChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-orange-500/50 rounded text-orange-400 font-mono text-sm focus:outline-none focus:border-orange-500 font-black"
                  />
                </div>
                <span className="text-[9px] text-neutral-400 block mt-1">
                  {isCustomPriceManual ? '✏️ Preço ajustado manualmente' : '⚡ Calculado via Margem + Over'}
                </span>
              </div>
            </div>
          </div>

          {/* OBSERVATIONS */}
          <div>
            <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Observações Técnicas / Fatiador / Notas de Produção</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
