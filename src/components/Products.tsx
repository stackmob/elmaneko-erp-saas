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

  // Compressão client-side de imagens para evitar payloads Base64 pesados no banco
  const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Cálculo de custos para exibição no formulário (informacional — painel reativo)
  // O campo "Preço de Venda" NÃO é atualizado automaticamente — use o botão "Calcular Preço"
  const formCalc = React.useMemo(() => calculateProductPricing({
    materials: formMaterials,
    filaments,
    tempoImpressao,
    tempoAcabamento,
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
  }), [formMaterials, filaments, tempoImpressao, tempoAcabamento, impressoraPadraoId, printers, tariffs,
      marginPercentage, outrasDespesas, valorMaoDeObra, overPercent,
      hasCustomMargemLucro, hasCustomMaoDeObra, hasCustomOutrasDespesas]);


  // Local File Readers for Image & PDF
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ser menor que 5MB.', 'error');
      return;
    }
    try {
      const compressed = await compressImage(file, 800, 0.8);
      setImagem(compressed);
    } catch {
      showToast('Erro ao processar imagem.', 'error');
    }
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

    // Preço não calculado automaticamente — clique em "Calcular Preço" para gerar
    setPrecoVenda(0);
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

    // Carrega o preço gravado no banco — não recalcula automaticamente
    setPrecoVenda(p.precoVenda && p.precoVenda > 0 ? p.precoVenda : 0);
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
    showToast('Parâmetros globais aplicados. Clique em "Calcular Preço" para atualizar o preço de venda.', 'info');
  };

  // Único ponto de cálculo de preço — acionado EXCLUSIVAMENTE pelo botão "Calcular Preço"
  const handleCalculatePrice = () => {
    const price = formCalc.suggestedPrice;
    setPrecoVenda(price);
    showToast(`✅ Preço calculado e aplicado: R$ ${price.toFixed(2)}`, 'success');
  };

  const handleAddBOMItem = () => {
    setFormMaterials(prev => [...prev, { tipoFilamento: 'PLA' as FilamentType, filamentoId: 'any', quantidadeGrams: 50 }]);
  };

  const handleRemoveBOMItem = (index: number) => {
    if (formMaterials.length === 1) return;
    setFormMaterials(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleBOMChange = (index: number, key: keyof BOMItem, value: any) => {
    setFormMaterials(prev => {
      const list = [...prev];
      if (key === 'tipoFilamento') {
        list[index] = { ...list[index], tipoFilamento: value as FilamentType, filamentoId: 'any' };
      } else if (key === 'filamentoId') {
        list[index] = { ...list[index], filamentoId: value };
      } else if (key === 'quantidadeGrams') {
        list[index] = { ...list[index], quantidadeGrams: Number(value) };
      }
      return list;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !categoria || formMaterials.length === 0) {
      showToast('Preencha os campos obrigatórios (Nome, Categoria e Materiais).', 'error');
      return;
    }

    if (!precoVenda || Number(precoVenda) <= 0) {
      showToast('Defina o Preço de Venda ou utilize o botão "Calcular Preço" antes de salvar.', 'error');
      return;
    }

    const sanitizedMaterials = formMaterials
      .filter(m => Number(m.quantidadeGrams) > 0)
      .map(m => ({
        tipoFilamento: m.tipoFilamento,
        filamentoId: m.filamentoId || 'any',
        quantidadeGrams: Math.max(0.1, Number(m.quantidadeGrams) || 0.1)
      }));

    if (sanitizedMaterials.length === 0) {
      showToast('Adicione pelo menos um filamento com quantidade válida na ficha técnica (BOM).', 'error');
      return;
    }

    const productData: Omit<Product, 'id'> = {
      nome: nome.trim(),
      categoria: categoria.trim(),
      descricao: descricao?.trim() || '',
      imagem: imagem || '',
      pdfProjeto: pdfProjeto || '',
      pdfProjetoNome: pdfProjetoNome || '',
      linkProjeto: linkProjeto?.trim() || '',
      tempoImpressao: Math.max(0.01, Number(tempoImpressao) || 0.01),
      impressoraPadraoId,
      materials: sanitizedMaterials,
      tempoAcabamento: Math.max(0, Number(tempoAcabamento) || 0),
      valorMaoDeObra: Math.max(0, Number(valorMaoDeObra) || 0),
      outrasDespesas: Math.max(0, Number(outrasDespesas) || 0),
      margemLucro: Math.max(0, Number(marginPercentage) || 0),
      overPercent: Math.max(0, Number(overPercent) || 0),
      precoVenda: Math.max(0, Number(precoVenda) || 0),
      hasCustomMargemLucro,
      hasCustomMaoDeObra,
      hasCustomOutrasDespesas,
      observacoes: observacoes?.trim() || ''
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

  // ── Lazy Loading ──────────────────────────────────────────────
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  // Reset pagination whenever the filter or base list changes
  React.useEffect(() => { setVisibleCount(PAGE_SIZE); }, [products, searchQuery]);

  // Filtered Products Search Computation
  const filteredProducts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => (
      (p.nome && p.nome.toLowerCase().includes(q)) ||
      (p.categoria && p.categoria.toLowerCase().includes(q)) ||
      (p.descricao && p.descricao.toLowerCase().includes(q))
    ));
  }, [products, searchQuery]);

  // Slice: only what's actually rendered in the DOM
  const paginatedProducts = React.useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const isLoadingMoreRef = React.useRef(false);
  const handleLoadMore = React.useCallback(() => {
    if (isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setVisibleCount(prev => {
      const next = Math.min(prev + PAGE_SIZE, filteredProducts.length);
      // release guard after state schedules the update
      requestAnimationFrame(() => { isLoadingMoreRef.current = false; });
      return next;
    });
  }, [filteredProducts.length]);

  // Pre-compute pricing only for the VISIBLE slice (not the full list)
  const productPricingMap = React.useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateProductPricing>>();
    for (const p of paginatedProducts) {
      map.set(p.id, calculateProductPricing({
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
      }));
    }
    return map;
  }, [paginatedProducts, filaments, printers, tariffs]);

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
          id="add-new-product-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <Plus size={18} />
          Cadastrar Peça (Ficha Técnica)
        </button>
      </div>

      {(printers.length === 0 || filaments.length === 0) && (
        <div className="p-3 bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded-xl flex items-center gap-2" id="product-warnings-box">
          <span className="text-orange-400 font-bold">💡 Dica:</span> Cadastrar impressoras e filamentos no sistema aprimora o cálculo automático exato de eletricidade e custos por grama na sua ficha técnica (BOM).
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
        data={paginatedProducts}
        totalCount={filteredProducts.length}
        onLoadMore={visibleCount < filteredProducts.length ? handleLoadMore : undefined}
        rowKey={(p) => p.id}
        columns={[
          {
            key: 'nome',
            header: 'Produto / Categoria',
            render: (p) => (
              <div className="flex items-center gap-3">
                {p.imagem ? (
                  <img src={p.imagem} alt={p.nome} loading="lazy" decoding="async" className="w-10 h-10 rounded-lg object-cover border border-neutral-800 shrink-0" />
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
              const calc = productPricingMap.get(p.id);
              return <span className="font-mono font-semibold text-white">R$ {calc?.costTotal.toFixed(2) ?? '—'}</span>;
            },
          },
          {
            key: 'preco',
            header: 'Preço Sugerido / Venda',
            align: 'right',
            render: (p) => {
              const calc = productPricingMap.get(p.id);
              const finalPrice = (p.precoVenda && p.precoVenda > 0) ? p.precoVenda : (calc?.suggestedPrice ?? 0);
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
        pageSize={PAGE_SIZE}
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
                  onChange={(e) => setTempoImpressao(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-[11px] min-h-[28px] flex items-end">Impressora Padrão</label>
                <select
                  value={impressoraPadraoId}
                  onChange={(e) => setImpressoraPadraoId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="">Nenhuma / Definir na Produção</option>
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
                    setValorMaoDeObra(Number(e.target.value));
                    setHasCustomMaoDeObra(true);
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
                    setOutrasDespesas(Number(e.target.value));
                    setHasCustomOutrasDespesas(true);
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

          {/* CUSTOS INFORMACIONAIS & PRECIFICAÇÃO MANUAL */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900 pb-2">
              <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} /> Custos & Precificação
              </h4>

              <div className="flex items-center gap-2">
                {(hasCustomMargemLucro || hasCustomMaoDeObra || hasCustomOutrasDespesas) && (
                  <button
                    type="button"
                    onClick={handleUseGlobalDefaults}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw size={12} />
                    Restaurar Padrões
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCalculatePrice}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-orange-600/20 hover:translate-y-[-1px]"
                >
                  <Sparkles size={13} />
                  Calcular Preço
                </button>
              </div>
            </div>

            {/* Breakdown de Custos — apenas informacional, não define o preço automaticamente */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
              <div className="bg-neutral-900 p-2 rounded border border-neutral-850">
                <span className="text-neutral-500 uppercase text-[9px] block">Insumos (BOM)</span>
                <strong className="text-white text-xs">R$ {formCalc.costBOM.toFixed(2)}</strong>
              </div>

              <div className="bg-neutral-900 p-2 rounded border border-neutral-850">
                <span className="text-neutral-500 uppercase text-[9px] block">Energia</span>
                <strong className="text-white text-xs">R$ {formCalc.costEnergy.toFixed(2)}</strong>
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
                <strong className="text-white text-xs">R$ {formCalc.valorMaoDeObra.toFixed(2)}</strong>
                {formCalc.isMaoDeObraCapped && (
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
                <strong className="text-white text-xs">R$ {formCalc.outrasDespesas.toFixed(2)}</strong>
              </div>

              <div className="bg-neutral-900 p-2 rounded border border-neutral-850 col-span-2 sm:col-span-1">
                <span className="text-orange-400 uppercase text-[9px] font-bold block">Custo Total</span>
                <strong className="text-orange-400 text-sm font-bold">R$ {formCalc.costTotal.toFixed(2)}</strong>
              </div>
            </div>

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
                      setMarginPercentage(Number(e.target.value));
                    }}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white font-mono text-xs focus:outline-none focus:border-orange-500 font-bold"
                  />
                  <span className="text-neutral-400 font-mono text-xs">%</span>
                </div>
                <span className="text-[9px] text-neutral-500 block mt-1">
                  Lucro estimado: R$ {(formCalc.costTotal * (marginPercentage / 100)).toFixed(2)}
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
                    onChange={(e) => setOverPercent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white font-mono text-xs focus:outline-none focus:border-orange-500 font-bold"
                  />
                  <span className="text-neutral-400 font-mono text-xs">%</span>
                </div>
                <span className="text-[9px] text-neutral-500 block mt-1">
                  Valor Over: R$ {(formCalc.costTotal * (overPercent / 100)).toFixed(2)}
                </span>
              </div>

              <div className={`p-3 rounded-lg border shadow-inner transition-colors ${
                precoVenda > 0 
                  ? 'bg-neutral-900 border-orange-500/30' 
                  : 'bg-red-950/20 border-red-500/50'
              }`}>
                <label className={`block text-[10px] uppercase tracking-wider font-bold mb-1 ${
                  precoVenda > 0 ? 'text-orange-400' : 'text-red-400'
                }`}>
                  Preço de Venda (R$) *
                </label>
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold text-xs ${precoVenda > 0 ? 'text-orange-500' : 'text-red-400'}`}>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={precoVenda > 0 ? Number(precoVenda.toFixed(2)) : ''}
                    placeholder="0.00"
                    onChange={(e) => setPrecoVenda(Number(e.target.value))}
                    className={`w-full px-3 py-1.5 bg-neutral-950 border rounded font-mono text-sm focus:outline-none font-black ${
                      precoVenda > 0 
                        ? 'border-orange-500/50 text-orange-400 focus:border-orange-500' 
                        : 'border-red-500/60 text-red-300 focus:border-red-500 placeholder-red-700/50'
                    }`}
                  />
                </div>
                <span className={`text-[9px] block mt-1 font-medium ${
                  precoVenda > 0 ? 'text-neutral-400' : 'text-red-400 font-semibold'
                }`}>
                  {precoVenda > 0
                    ? `✅ R$ ${precoVenda.toFixed(2)} gravado — altere ou clique em "Calcular Preço"`
                    : `⚠️ Preço obrigatório: defina manualmente ou clique em "Calcular Preço"`}
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
