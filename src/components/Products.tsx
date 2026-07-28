import React, { useState } from 'react';
import { Product, BOMItem, Printer, Filament, EnergyTariff, FilamentType } from '../types';
import { Plus, Edit, Trash2, List, ClipboardList, Info, DollarSign, PenTool, Flame, Sliders } from 'lucide-react';
import { useData } from '../hooks/useData';
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

      {/* PRODUCTS GRID CARDS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="products-list-grid">
        {products.length > 0 ? (
          products.map(p => {
            // CUSTO FILAMENTO (Regra do maior valor por tipo)
            const filamentCost = calculateBOMCost(p.materials);

            // CUSTO ENERGIA
            const energyCost = calculateEnergyCost(p.tempoImpressao, p.impressoraPadraoId);

            // CUSTO PRODUÇÃO TOTAL
            const productionCost = filamentCost + energyCost + p.valorMaoDeObra;

            // SUGGESTED SALES PRICE (Markup)
            const suggestedPrice = productionCost * (1 + marginPercentage / 100);

            const printerName = printers.find(pr => pr.id === p.impressoraPadraoId)?.nome || 'Impressora Indefinida';

            return (
              <div 
                key={p.id} 
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-orange-500/20 transition-all duration-300 relative flex flex-col justify-between"
                id={`product-card-${p.id}`}
              >
                <div>
                  {/* Category and Title */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-neutral-950 px-2 py-0.5 rounded text-neutral-400 border border-neutral-800">
                        {p.categoria}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1.5">{p.nome}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Editar Ficha"
                        id={`edit-prod-btn-${p.id}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.nome)}
                        className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Ficha"
                        id={`delete-prod-btn-${p.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                    {p.descricao || <span className="text-neutral-600 italic">Sem descrição disponível.</span>}
                  </p>

                  {/* Ficha técnica BOM list */}
                  <div className="mt-4 bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 space-y-2">
                    <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold flex items-center gap-1">
                      <ClipboardList size={12} /> Materiais Necessários (BOM)
                    </h4>
                    
                    <div className="space-y-1.5 text-xs font-mono">
                      {p.materials.map((mat, mIdx) => {
                        const maxRate = getMaxCostPerGram(mat.tipoFilamento);
                        const itemCost = mat.quantidadeGrams * maxRate;
                        return (
                          <div key={mIdx} className="flex justify-between text-neutral-300 border-b border-neutral-900 pb-1 last:border-0 last:pb-0">
                            <span>
                              • {mat.quantidadeGrams}g de <strong className="text-white">{mat.tipoFilamento}</strong>
                            </span>
                            <span className="text-neutral-500 text-[10px]">
                              Taxa: R$ {maxRate.toFixed(4)}/g → <strong className="text-orange-500">R$ {itemCost.toFixed(2)}</strong>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Specs & Hardware */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono text-neutral-400 border-t border-neutral-800/60 pt-4">
                    <div>
                      <span>Impressora Padrão:</span>
                      <div className="text-white font-semibold truncate mt-0.5">{printerName}</div>
                    </div>
                    <div>
                      <span>Tempo de Manufatura:</span>
                      <div className="text-white font-semibold mt-0.5">
                        {p.tempoImpressao}h imp. {p.tempoAcabamento ? `+ ${p.tempoAcabamento}h acab.` : ''}
                      </div>
                    </div>
                  </div>

                </div>

                {/* COST BREAKDOWN AND PRICE COMPONENT */}
                <div className="border-t border-neutral-800/80 mt-5 pt-4 space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono uppercase text-neutral-500" id="pricing-breakdown-subtotals">
                    <div className="bg-neutral-950 p-2 rounded-lg">
                      <span>Insumos</span>
                      <div className="text-xs text-white font-bold mt-1">R$ {filamentCost.toFixed(2)}</div>
                    </div>
                    <div className="bg-neutral-950 p-2 rounded-lg">
                      <span>Energia</span>
                      <div className="text-xs text-white font-bold mt-1">R$ {energyCost.toFixed(2)}</div>
                    </div>
                    <div className="bg-neutral-950 p-2 rounded-lg">
                      <span>Mão Obra</span>
                      <div className="text-xs text-white font-bold mt-1">R$ {p.valorMaoDeObra.toFixed(2)}</div>
                    </div>
                    <div className="bg-neutral-950 p-2 rounded-lg border border-orange-500/10">
                      <span className="text-orange-400 font-bold">Custo Total</span>
                      <div className="text-xs text-orange-500 font-black mt-1">R$ {productionCost.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-orange-950/20 border border-orange-500/15 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <Sliders size={16} className="text-orange-500" />
                      <div className="text-left">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Margem de Lucro Sugerida</span>
                        <div className="text-xs text-white font-bold font-mono">Markup de {marginPercentage}%</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">Preço Venda Sugerido</span>
                      <div className="text-lg font-black text-orange-400 font-mono">
                        R$ {suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center text-neutral-500 font-mono text-xs bg-neutral-900 border border-neutral-800 rounded-2xl">
            Nenhum produto ou ficha técnica cadastrada ainda. Clique no botão acima para adicionar.
          </div>
        )}
      </div>

      {/* PRODUCT / BOM DIALOG FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="product-form-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative my-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              < clipboard-list className="text-orange-500" />
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
