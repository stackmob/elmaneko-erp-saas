import React, { useState } from 'react';
import { Product, BOMItem, Printer, Filament, EnergyTariff, FilamentType } from '../types';
import { Plus, Search, ClipboardList, DollarSign, Sliders } from 'lucide-react';
import { useData } from '../hooks/useData';
import { DataList, ColumnDef } from './ui/DataList';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';

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
  const [tempoImpressao, setTempoImpressao] = useState(4); // hours
  const [impressoraPadraoId, setImpressoraPadraoId] = useState('');
  const [tempoAcabamento, setTempoAcabamento] = useState(0.5); // hours
  const [valorMaoDeObra, setValorMaoDeObra] = useState(30.00);
  const [observacoes, setObservacoes] = useState('');
  const [marginPercentage, setMarginPercentage] = useState(100); // 100% standard markup

  // BOM items list in the form
  const [formMaterials, setFormMaterials] = useState<BOMItem[]>([
    { tipoFilamento: 'PLA', filamentoId: 'any', quantidadeGrams: 100 }
  ]);

  // Active energy tariff
  const getActiveTariff = (): number => {
    if (tariffs.length === 0) return 0.85;
    const sorted = [...tariffs].sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
    return sorted[0].valorKwh;
  };
  const currentTariff = getActiveTariff();

  // CM-07: Corrige divisão por zero quando pesoTotal = 0
  const getMaxCostPerGram = (type: FilamentType): number => {
    const typeFilaments = filaments.filter(f => f.tipo === type);
    if (typeFilaments.length === 0) return 0.12;
    let maxRate = 0;
    typeFilaments.forEach(f => {
      const rate = f.pesoTotal > 0 ? f.valorCompra / f.pesoTotal : 0;
      if (rate > maxRate) maxRate = rate;
    });
    return maxRate;
  };

  // Helper to calculate BOM costs for UI
  const calculateBOMCost = (materials: BOMItem[]): number => {
    return materials.reduce((acc, item) => {
      const maxRate = getMaxCostPerGram(item.tipoFilamento);
      return acc + (item.quantidadeGrams * maxRate);
    }, 0);
  };

  const calculateEnergyCost = (tempo: number, printerId: string): number => {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return 0;
    const consumptionKwh = (printer.potenciaWatts * tempo) / 1000;
    return consumptionKwh * currentTariff;
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setNome('');
    setCategoria('Decoração');
    setDescricao('');
    setTempoImpressao(4);
    setImpressoraPadraoId(printers.length > 0 ? printers[0].id : '');
    setTempoAcabamento(0.5);
    setValorMaoDeObra(30.00);
    setObservacoes('');
    setFormMaterials([{ tipoFilamento: 'PLA', filamentoId: 'any', quantidadeGrams: 100 }]);
    setMarginPercentage(100);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setNome(p.nome);
    setCategoria(p.categoria);
    setDescricao(p.descricao || '');
    setTempoImpressao(p.tempoImpressao);
    setImpressoraPadraoId(p.impressoraPadraoId);
    setTempoAcabamento(p.tempoAcabamento || 0);
    setValorMaoDeObra(p.valorMaoDeObra);
    setObservacoes(p.observacoes || '');
    setFormMaterials(p.materials.map(m => ({ ...m })));
    setMarginPercentage(100);
    setIsModalOpen(true);
  };

  const handleAddBOMItem = () => {
    setFormMaterials([...formMaterials, { tipoFilamento: 'PLA', filamentoId: 'any', quantidadeGrams: 50 }]);
  };

  const handleRemoveBOMItem = (index: number) => {
    if (formMaterials.length === 1) return;
    setFormMaterials(formMaterials.filter((_, idx) => idx !== index));
  };

  const handleBOMChange = (index: number, key: keyof BOMItem, value: any) => {
    const list = [...formMaterials];
    if (key === 'tipoFilamento') {
      list[index].tipoFilamento = value as FilamentType;
      list[index].filamentoId = 'any'; // reset specific filament spool
    } else if (key === 'filamentoId') {
      list[index].filamentoId = value;
    } else if (key === 'quantidadeGrams') {
      list[index].quantidadeGrams = Number(value);
    }
    setFormMaterials(list);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !categoria || !impressoraPadraoId || formMaterials.length === 0) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const productData: Product = {
      id: editingProduct ? editingProduct.id : crypto.randomUUID(),
      nome,
      categoria,
      descricao,
      tempoImpressao: Number(tempoImpressao),
      impressoraPadraoId,
      materials: formMaterials,
      tempoAcabamento: Number(tempoAcabamento),
      valorMaoDeObra: Number(valorMaoDeObra),
      observacoes,
      imagem: editingProduct ? editingProduct.imagem : undefined
    };

    const onSuccess = () => {
      setIsModalOpen(false);
      showToast(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!', 'success');
    };
    const onError = () => showToast('Erro ao salvar produto. Tente novamente.', 'error');

    if (editingProduct) {
      editMutation.mutate(productData, { onSuccess, onError });
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
        <div className="p-4 bg-amber-950/40 border border-amber-800 text-amber-200 text-sm rounded-xl" id="prod-warnings-box">
          ⚠️ <strong>Atenção:</strong> Antes de cadastrar produtos, você deve certificar-se de ter pelo menos uma impressora ativa cadastrada em <strong>Impressoras</strong> e uma bobina em <strong>Filamentos</strong> para permitir o correto cálculo de custos da Bill of Materials (BOM).
        </div>
      )}

      {/* ── SEARCH BAR ── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        <input
          id="products-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar por nome, categoria ou descrição..."
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
          aria-label="Pesquisar produtos"
        />
      </div>

      {/* ── PRODUCT LIST ── */}
      <DataList<Product>
        data={(() => {
          if (!searchQuery.trim()) return products;
          const q = searchQuery.toLowerCase();
          return products.filter(p =>
            p.nome.toLowerCase().includes(q) ||
            p.categoria.toLowerCase().includes(q) ||
            (p.descricao || '').toLowerCase().includes(q)
          );
        })()}
        rowKey={(p) => p.id}
        onEdit={handleOpenEditModal}
        onDelete={(p) => handleDelete(p.id, p.nome)}
        emptyMessage={searchQuery ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado.'}
        columns={[
          {
            key: 'nome',
            header: 'Produto / Peça',
            render: (p) => (
              <div>
                <p className="font-semibold text-white text-sm">{p.nome}</p>
                <span className="text-[11px] font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 border border-neutral-700">
                  {p.categoria}
                </span>
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
              const fc = calculateBOMCost(p.materials);
              const ec = calculateEnergyCost(p.tempoImpressao, p.impressoraPadraoId);
              const total = fc + ec + p.valorMaoDeObra;
              return <span className="font-mono font-semibold text-white">R$ {total.toFixed(2)}</span>;
            },
          },
          {
            key: 'preco',
            header: 'Preço Sugerido',
            align: 'right',
            render: (p) => {
              const fc = calculateBOMCost(p.materials);
              const ec = calculateEnergyCost(p.tempoImpressao, p.impressoraPadraoId);
              const total = fc + ec + p.valorMaoDeObra;
              const price = total * (1 + marginPercentage / 100);
              return <span className="font-mono font-bold text-orange-400">R$ {price.toFixed(2)}</span>;
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
            key: 'bom',
            header: 'Materiais (BOM)',
            render: (p) => (
              <span className="text-neutral-300">
                {p.materials.map((m, i) => `${m.quantidadeGrams}g ${m.tipoFilamento}`).join(' · ')}
              </span>
            ),
          },
        ]}
      />

      {/* PRODUCT / BOM DIALOG FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" id="product-form-modal" aria-modal="true" role="dialog">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative my-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ClipboardList size={20} className="text-orange-500" />
              {editingProduct ? 'Editar Ficha Técnica do Produto' : 'Cadastrar Peça & Ficha Técnica (BOM)'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Nome da Peça / Produto acabado *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Categoria *</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Decoração">Decoração</option>
                    <option value="Escritório">Escritório</option>
                    <option value="Colecionáveis">Colecionáveis</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Brindes">Brindes</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Descrição do Item</label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Tempo de Impressão (Horas) *</label>
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
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Impressora Padrão *</label>
                  <select
                    value={impressoraPadraoId}
                    onChange={(e) => setImpressoraPadraoId(e.target.value)}
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
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Tempo de Acabamento (Horas, Opcional)</label>
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
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Valor Padrão de Mão de Obra R$ *</label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    min="0"
                    value={valorMaoDeObra}
                    onChange={(e) => setValorMaoDeObra(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* DYNAMIC BOM MATERIALS LIST */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <clipboard-list size={14} className="text-orange-500" /> Ficha de Insumos da Peça (BOM)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddBOMItem}
                    className="text-[10px] bg-orange-600 hover:bg-orange-500 text-white px-2.5 py-1 rounded font-bold cursor-pointer"
                  >
                    + Adicionar Material
                  </button>
                </div>

                {formMaterials.map((item, index) => {
                  // filter filaments corresponding to selected material type
                  const availableTypeFilaments = filaments.filter(f => f.tipo === item.tipoFilamento);

                  return (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-neutral-900 p-3 rounded-lg border border-neutral-850 relative">
                      
                      {/* Tipo Filamento */}
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

                      {/* Bobina Especifica ou Qualquer */}
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-neutral-400 mb-1 uppercase tracking-wider text-[10px]">Origem / Bobina sugerida</label>
                        <select
                          value={item.filamentoId}
                          onChange={(e) => handleBOMChange(index, 'filamentoId', e.target.value)}
                          className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-white text-[11px] focus:outline-none"
                        >
                          <option value="any">Usar maior valor de {item.tipoFilamento} (Recomendado)</option>
                          {availableTypeFilaments.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.marca} - {f.cor} (R$ {(f.valorCompra/f.pesoTotal).toFixed(4)}/g)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantidade em gramas */}
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-neutral-400 mb-1 uppercase tracking-wider text-[10px]">Massa (g) *</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={item.quantidadeGrams}
                            onChange={(e) => handleBOMChange(index, 'quantidadeGrams', e.target.value)}
                            className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-white text-[11px] focus:outline-none"
                          />
                        </div>
                        {formMaterials.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBOMItem(index)}
                            className="text-red-500 hover:text-red-400 p-1 bg-neutral-950 rounded border border-neutral-850 mt-4"
                            title="Remover Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* REAL-TIME COST SUMMARY AND PRICING CALCULATORS */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider">Detalhamento de Custos Provisórios</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="bg-neutral-900 p-3 rounded border border-neutral-850">
                    <span className="text-neutral-500 uppercase text-[9px] block">Custo de Insumo (BOM)</span>
                    <strong className="text-white text-sm">
                      R$ {calculateBOMCost(formMaterials).toFixed(2)}
                    </strong>
                  </div>

                  <div className="bg-neutral-900 p-3 rounded border border-neutral-850">
                    <span className="text-neutral-500 uppercase text-[9px] block">Custo de Energia</span>
                    <strong className="text-white text-sm">
                      R$ {calculateEnergyCost(tempoImpressao, impressoraPadraoId).toFixed(2)}
                    </strong>
                  </div>

                  <div className="bg-neutral-900 p-3 rounded border border-neutral-850">
                    <span className="text-neutral-500 uppercase text-[9px] block">Valor Mão de Obra</span>
                    <strong className="text-white text-sm">
                      R$ {Number(valorMaoDeObra).toFixed(2)}
                    </strong>
                  </div>

                  <div className="bg-orange-950/20 p-3 rounded border border-orange-500/10">
                    <span className="text-orange-400 uppercase text-[9px] block">Custo de Fabricação</span>
                    <strong className="text-orange-500 text-sm font-black">
                      R$ {(calculateBOMCost(formMaterials) + calculateEnergyCost(tempoImpressao, impressoraPadraoId) + Number(valorMaoDeObra)).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t border-neutral-900 pt-3">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-neutral-400 text-xs font-mono uppercase tracking-wider">Margem de Lucro (%):</span>
                    <input
                      type="number"
                      min="0"
                      value={marginPercentage}
                      onChange={(e) => setMarginPercentage(Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-white text-center font-mono font-semibold"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 block uppercase">PREÇO SUGERIDO DE VENDA</span>
                    <strong className="text-orange-400 text-base">
                      R$ {((calculateBOMCost(formMaterials) + calculateEnergyCost(tempoImpressao, impressoraPadraoId) + Number(valorMaoDeObra)) * (1 + marginPercentage / 100)).toFixed(2)}
                    </strong>
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

              {/* SUBMIT BUTTONS */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Salvar Peça & Ficha Técnica
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
