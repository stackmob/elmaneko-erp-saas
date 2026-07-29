import React, { useState } from 'react';
import { Purchase, PurchaseCategory, SupplyUnit, Filament, SupplyItem } from '../types';
import { Plus, ShoppingCart, Calendar, Building, DollarSign, FileText, Search, Tag, Package, Cpu, Wrench, Box, Sparkles, Filter, CheckCircle2, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import { Modal } from './ui/Modal';
import SearchableSelect, { SelectOption } from './ui/SearchableSelect';

export default function Purchases() {
  const { useCompras, useFilamentos, useInsumos, useAddCompra, useUpdateCompra, useDeleteCompra } = useData();
  const { data: purchases = [] } = useCompras();
  const { data: filaments = [] } = useFilamentos();
  const { data: supplies = [] } = useInsumos();
  const addMutation = useAddCompra();
  const updateMutation = useUpdateCompra();
  const deleteMutation = useDeleteCompra();
  const { toast, showToast, hideToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form fields
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [selectedItemId, setSelectedItemId] = useState<string>(''); // Selected supply or filament ID
  const [insumoId, setInsumoId] = useState<string>('');
  const [filamentoId, setFilamentoId] = useState<string>('');
  const [categoriaItem, setCategoriaItem] = useState<PurchaseCategory>('Filamento');
  const [descricaoItem, setDescricaoItem] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [unidadeMedida, setUnidadeMedida] = useState<SupplyUnit>('un');
  const [quantidadeAdquirida, setQuantidadeAdquirida] = useState(1000); // grams if filament
  const [fornecedor, setFornecedor] = useState('');
  const [valorPago, setValorPago] = useState(120.00);
  const [notaFiscal, setNotaFiscal] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Prepare options for SearchableSelect combobox
  const searchableOptions: SelectOption[] = [
    // 1. Filaments
    ...filaments.map((f) => ({
      id: `fil_${f.id}`,
      label: f.nome,
      sublabel: `Filamento ${f.tipo} - ${f.cor} • Est: ${f.quantidadeDisponivel}g`,
      category: 'Filamento',
      badge: 'Filamento',
    })),
    // 2. Supplies / Insumos
    ...supplies.map((s) => ({
      id: `ins_${s.id}`,
      label: s.nome,
      sublabel: `${s.categoria} • Est: ${s.quantidadeEstoque} ${s.unidadeMedida}`,
      category: s.categoria,
      badge: s.categoria,
    })),
  ];

  const handleOpenModal = (purchaseToEdit?: Purchase) => {
    if (purchaseToEdit) {
      setEditingPurchase(purchaseToEdit);
      setData(purchaseToEdit.data || new Date().toISOString().split('T')[0]);
      setInsumoId(purchaseToEdit.insumoId || '');
      setFilamentoId(purchaseToEdit.filamentoId || '');
      
      if (purchaseToEdit.filamentoId) {
        setSelectedItemId(`fil_${purchaseToEdit.filamentoId}`);
      } else if (purchaseToEdit.insumoId) {
        setSelectedItemId(`ins_${purchaseToEdit.insumoId}`);
      } else {
        setSelectedItemId('');
      }

      setCategoriaItem(purchaseToEdit.categoriaItem || 'Filamento');
      setDescricaoItem(purchaseToEdit.descricaoItem || '');
      setQuantidade(purchaseToEdit.quantidade || 1);
      setUnidadeMedida(purchaseToEdit.unidadeMedida || 'un');
      setQuantidadeAdquirida(purchaseToEdit.quantidadeAdquirida || 1000);
      setFornecedor(purchaseToEdit.fornecedor || '');
      setValorPago(purchaseToEdit.valorPago || 0);
      setNotaFiscal(purchaseToEdit.notaFiscal || '');
      setObservacoes(purchaseToEdit.observacoes || '');
    } else {
      setEditingPurchase(null);
      setData(new Date().toISOString().split('T')[0]);
      setSelectedItemId('');
      setInsumoId('');
      setFilamentoId('');
      setCategoriaItem('Filamento');
      setDescricaoItem('');
      setQuantidade(1);
      setUnidadeMedida('g');
      setQuantidadeAdquirida(1000);
      setFornecedor('');
      setValorPago(120.00);
      setNotaFiscal('');
      setObservacoes('');
    }
    setIsModalOpen(true);
  };

  const handleSelectItemChange = (id: string) => {
    setSelectedItemId(id);
    if (!id) {
      setInsumoId('');
      setFilamentoId('');
      return;
    }

    if (id.startsWith('fil_')) {
      const realId = id.replace('fil_', '');
      const fil = filaments.find((f) => f.id === realId);
      if (fil) {
        setFilamentoId(realId);
        setInsumoId('');
        setCategoriaItem('Filamento');
        setDescricaoItem(fil.nome);
        setUnidadeMedida('g');
        setQuantidade(1000);
        setQuantidadeAdquirida(1000);
        if (fil.fornecedor) setFornecedor(fil.fornecedor);
        if (fil.valorCompra) setValorPago(fil.valorCompra);
      }
    } else if (id.startsWith('ins_')) {
      const realId = id.replace('ins_', '');
      const ins = supplies.find((s) => s.id === realId);
      if (ins) {
        setInsumoId(realId);
        setFilamentoId('');
        setCategoriaItem(ins.categoria);
        setDescricaoItem(ins.nome);
        setUnidadeMedida(ins.unidadeMedida || 'un');
        setQuantidade(1);
        if (ins.fornecedorPadrao) setFornecedor(ins.fornecedorPadrao);
        if (ins.custoUnitarioPadrao) setValorPago(ins.custoUnitarioPadrao);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedor || valorPago < 0) {
      showToast('Por favor, preencha o fornecedor e valor pago.', 'error');
      return;
    }

    if (!descricaoItem && !filamentoId && !insumoId) {
      showToast('Selecione um item do catálogo ou digite a descrição do produto.', 'error');
      return;
    }

    // Determine weight in grams for filaments
    let grams = 0;
    if (categoriaItem === 'Filamento') {
      if (unidadeMedida === 'Kg') grams = Number(quantidade) * 1000;
      else grams = Number(quantidade);
    }

    const purchasePayload: Purchase = {
      id: editingPurchase ? editingPurchase.id : crypto.randomUUID(),
      data,
      fornecedor,
      insumoId: insumoId || undefined,
      filamentoId: filamentoId || undefined,
      categoriaItem,
      descricaoItem,
      quantidade: Number(quantidade),
      unidadeMedida,
      quantidadeAdquirida: categoriaItem === 'Filamento' ? (grams > 0 ? grams : Number(quantidadeAdquirida)) : 0,
      valorPago: Number(valorPago),
      notaFiscal,
      observacoes,
    };

    if (editingPurchase) {
      updateMutation.mutate(purchasePayload, {
        onSuccess: () => {
          setIsModalOpen(false);
          setEditingPurchase(null);
          showToast('Registro de compra atualizado com sucesso!', 'success');
        },
        onError: () => showToast('Erro ao atualizar registro de compra.', 'error'),
      });
    } else {
      addMutation.mutate(purchasePayload, {
        onSuccess: () => {
          setIsModalOpen(false);
          showToast(
            categoriaItem === 'Filamento' || insumoId
              ? 'Compra registrada e estoque atualizado no catálogo!'
              : 'Compra registrada com sucesso!',
            'success'
          );
        },
        onError: () => showToast('Erro ao registrar compra.', 'error'),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!purchaseToDelete) return;
    deleteMutation.mutate(purchaseToDelete.id, {
      onSuccess: () => {
        setPurchaseToDelete(null);
        showToast('Registro de compra excluído com sucesso!', 'success');
      },
      onError: () => showToast('Erro ao excluir compra.', 'error'),
    });
  };

  // Category Badge Color Mapping
  const getCategoryBadge = (cat: PurchaseCategory = 'Filamento') => {
    switch (cat) {
      case 'Filamento':
        return { label: 'Filamento', bg: 'bg-orange-950/60 text-orange-400 border-orange-500/30', icon: Box };
      case 'Cola / Adesivo':
        return { label: 'Cola / Adesivo', bg: 'bg-blue-950/60 text-blue-400 border-blue-500/30', icon: Sparkles };
      case 'Embalagem / Caixas':
        return { label: 'Embalagem', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30', icon: Package };
      case 'Acessórios / Componentes':
        return { label: 'Acessórios', bg: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30', icon: Tag };
      case 'Impressoras 3D':
        return { label: 'Impressora 3D', bg: 'bg-purple-950/60 text-purple-400 border-purple-500/30', icon: Cpu };
      case 'Peças de Manutenção / Peças de Impressoras':
        return { label: 'Peças Impressora', bg: 'bg-amber-950/60 text-amber-400 border-amber-500/30', icon: Wrench };
      default:
        return { label: 'Outros Insumos', bg: 'bg-neutral-800 text-neutral-300 border-neutral-700', icon: ShoppingCart };
    }
  };

  // Filtering Computation
  const filteredPurchases = purchases.filter((p) => {
    const catMatch = selectedCategoryFilter === 'all' || (p.categoriaItem || 'Filamento') === selectedCategoryFilter;
    if (!catMatch) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const filamentObj = filaments.find((f) => f.id === p.filamentoId);
    const supplyObj = supplies.find((s) => s.id === p.insumoId);

    return (
      (p.fornecedor && p.fornecedor.toLowerCase().includes(q)) ||
      (p.descricaoItem && p.descricaoItem.toLowerCase().includes(q)) ||
      (p.notaFiscal && p.notaFiscal.toLowerCase().includes(q)) ||
      (filamentObj && filamentObj.nome.toLowerCase().includes(q)) ||
      (supplyObj && supplyObj.nome.toLowerCase().includes(q))
    );
  });

  const totalSpent = filteredPurchases.reduce((acc, p) => acc + p.valorPago, 0);
  const totalFilamentGrams = filteredPurchases
    .filter((p) => (p.categoriaItem || 'Filamento') === 'Filamento')
    .reduce((acc, p) => acc + (p.quantidadeAdquirida || 0), 0);

  return (
    <div className="space-y-6" id="purchases-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />

      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="purchases-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Controle de Compras & Entrada de Insumos</h2>
          <p className="text-sm text-neutral-400 mt-1">Registre, edite e acompanhe compras de insumos com atualização instantânea e controle total.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          id="add-new-purchase-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <Plus size={18} />
          Registrar Compra
        </button>
      </div>

      {/* INVESTMENT METRICS BOX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="purchases-kpis">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <DollarSign size={22} />
          </div>
          <div>
            <div className="text-xs font-mono text-neutral-400 uppercase">Investimento Acumulado Filtrado</div>
            <div className="text-xl font-black text-white mt-1">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <Box size={22} />
          </div>
          <div>
            <div className="text-xs font-mono text-neutral-400 uppercase">Filamentos Adquiridos</div>
            <div className="text-xl font-black text-white mt-1">{(totalFilamentGrams / 1000).toFixed(2)} <span className="text-sm font-normal text-neutral-400">Kg</span></div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <ShoppingCart size={22} />
          </div>
          <div>
            <div className="text-xs font-mono text-neutral-400 uppercase">Total de Compras</div>
            <div className="text-xl font-black text-white mt-1">{filteredPurchases.length} <span className="text-sm font-normal text-neutral-400">lotes</span></div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR WITH LIVE MATCHING */}
      <div className="flex flex-col sm:flex-row gap-3" id="purchases-filters">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar digitando parte do nome do insumo, fornecedor ou NF..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-neutral-500 shrink-0" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            <option value="Filamento">Filamentos</option>
            <option value="Cola / Adesivo">Cola / Adesivos</option>
            <option value="Embalagem / Caixas">Embalagens / Caixas</option>
            <option value="Acessórios / Componentes">Acessórios / Componentes</option>
            <option value="Impressoras 3D">Impressoras 3D</option>
            <option value="Peças de Manutenção / Peças de Impressoras">Peças de Manutenção</option>
            <option value="Outros Insumos">Outros Insumos</option>
          </select>
        </div>
      </div>

      {/* PURCHASES TABLE */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl" id="purchases-table-box">
        <div className="p-4 bg-neutral-950/40 border-b border-neutral-800 flex justify-between items-center">
          <h3 className="text-xs font-mono uppercase text-neutral-400 tracking-wider font-semibold">Histórico de Compras Realizadas</h3>
          <span className="text-xs text-neutral-500 font-mono">Mais recentes primeiro</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="purchases-table">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/20 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                <th className="py-4 px-4 font-semibold">Data</th>
                <th className="py-4 px-4 font-semibold">Categoria</th>
                <th className="py-4 px-4 font-semibold">Item / Insumo Comprado</th>
                <th className="py-4 px-4 font-semibold">Fornecedor</th>
                <th className="py-4 px-4 font-semibold text-right">Qtd & Unidade</th>
                <th className="py-4 px-4 font-semibold text-right">Valor Pago</th>
                <th className="py-4 px-4 font-semibold">Nota Fiscal</th>
                <th className="py-4 px-4 font-semibold">Observações</th>
                <th className="py-4 px-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-300 font-mono">
              {filteredPurchases.length > 0 ? (
                [...filteredPurchases].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((p) => {
                  const catBadge = getCategoryBadge(p.categoriaItem);
                  const IconComp = catBadge.icon;
                  const filamentObj = filaments.find((f) => f.id === p.filamentoId);
                  const supplyObj = supplies.find((s) => s.id === p.insumoId);
                  const displayUnit = p.unidadeMedida ? p.unidadeMedida.toUpperCase() : ((p.categoriaItem || 'Filamento') === 'Filamento' ? 'G' : 'UN');

                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/10 transition-colors">
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1 text-neutral-400">
                          <Calendar size={12} />
                          {p.data}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-semibold border rounded-lg flex items-center gap-1.5 w-fit ${catBadge.bg}`}>
                          <IconComp size={12} />
                          {catBadge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.insumoId && supplyObj ? (
                          <div>
                            <span className="text-white font-semibold flex items-center gap-1.5">
                              {supplyObj.nome}
                              <CheckCircle2 size={12} className="text-emerald-400" title="Item do Catálogo" />
                            </span>
                            <span className="text-[11px] text-neutral-500">Catálogo: {supplyObj.categoria}</span>
                          </div>
                        ) : p.filamentoId && filamentObj ? (
                          <div>
                            <span className="text-white font-semibold flex items-center gap-1.5">
                              {filamentObj.nome}
                              <CheckCircle2 size={12} className="text-orange-400" title="Filamento do Estoque" />
                            </span>
                            <span className="text-[11px] text-neutral-500">Filamento: {filamentObj.tipo} • {filamentObj.cor}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-white font-semibold block">{p.descricaoItem || 'Item Diverso'}</span>
                            <span className="text-[11px] text-neutral-500">Registro Manual</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-sans font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          <Building size={14} className="text-neutral-500" />
                          {p.fornecedor}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-white">
                        <span>
                          {p.quantidade || p.quantidadeAdquirida || 1}{' '}
                          <span className="text-xs font-semibold text-orange-400 bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-500/20">
                            {displayUnit}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-orange-400">
                        R$ {p.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-neutral-400">
                        {p.notaFiscal ? (
                          <span className="bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded text-white">
                            {p.notaFiscal}
                          </span>
                        ) : (
                          <span className="text-neutral-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-neutral-400 max-w-xs truncate" title={p.observacoes}>
                        {p.observacoes || <span className="text-neutral-600 italic">-</span>}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenModal(p)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="Editar Compra"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setPurchaseToDelete(p)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Excluir Compra"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500 text-xs">
                    Nenhuma compra encontrada para a pesquisa efetuada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM DIALOG REUSABLE MODAL COMPONENT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPurchase(null);
        }}
        maxWidth="lg"
        title={
          <span className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-orange-500" />
            {editingPurchase ? 'Editar Compra de Insumo / Material' : 'Registrar Compra de Insumo / Material'}
          </span>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingPurchase(null);
              }}
              className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                const formEl = document.getElementById('purchase-form-element') as HTMLFormElement;
                if (formEl) formEl.requestSubmit();
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-orange-600/20"
            >
              {editingPurchase ? 'Salvar Alterações' : 'Registrar Compra'}
            </button>
          </>
        }
      >
        <form id="purchase-form-element" onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* SEARCHABLE SELECT COMBOBOX */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <SearchableSelect
              label="Buscar & Selecionar Item do Catálogo"
              placeholder="Digite qualquer parte do nome (ex: cola, caixa, m3, pla)..."
              options={searchableOptions}
              value={selectedItemId}
              onChange={handleSelectItemChange}
              emptyMessage="Nenhum item do catálogo encontrado com este nome."
            />
            <span className="text-[10px] text-neutral-500 block">
              💡 Digite o nome para autocompletar ou preencha os campos abaixo caso o item ainda não esteja cadastrado.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            
            {/* Data */}
            <div>
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Data da Compra *</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Categoria *</label>
              <select
                value={categoriaItem}
                onChange={(e) => setCategoriaItem(e.target.value as PurchaseCategory)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="Filamento">Filamento</option>
                <option value="Cola / Adesivo">Cola / Adesivo de Mesa</option>
                <option value="Embalagem / Caixas">Embalagem / Caixas</option>
                <option value="Acessórios / Componentes">Acessórios / Componentes</option>
                <option value="Impressoras 3D">Impressora 3D</option>
                <option value="Peças de Manutenção / Peças de Impressoras">Peça de Impressora / Manutenção</option>
                <option value="Outros Insumos">Outros Insumos</option>
              </select>
            </div>

            {/* Descrição do Item */}
            <div className="col-span-2">
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Nome / Descrição do Item *</label>
              <input
                type="text"
                required
                value={descricaoItem}
                onChange={(e) => setDescricaoItem(e.target.value)}
                placeholder="Ex: Cola em Bastão Kores / Bobina PLA Preto 1kg"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Quantidade *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Unidade de Medida */}
            <div>
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Unidade de Medida *</label>
              <select
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value as SupplyUnit)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="un">Unidade (un)</option>
                <option value="g">Gramas (g)</option>
                <option value="Kg">Quilos (Kg)</option>
                <option value="metro">Metro (m)</option>
                <option value="rolo">Rolo</option>
                <option value="caixa">Caixa</option>
                <option value="pacote">Pacote</option>
                <option value="litro">Litro (l)</option>
              </select>
            </div>

            {/* Fornecedor */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Fornecedor / Loja *</label>
              <input
                type="text"
                required
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Ex: Mercado Livre / 3D Fila"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Valor Pago */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Valor Total Pago (R$) *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={valorPago}
                onChange={(e) => setValorPago(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 font-bold text-orange-400"
              />
            </div>

            {/* Nota Fiscal */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Nota Fiscal (opcional)</label>
              <input
                type="text"
                value={notaFiscal}
                onChange={(e) => setNotaFiscal(e.target.value)}
                placeholder="Ex: NF-e 88102"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Observações */}
            <div className="col-span-2">
              <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
                placeholder="Notas adicionais sobre a compra..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* CONFIRMATION DELETE DIALOG USING REUSABLE MODAL */}
      <Modal
        isOpen={!!purchaseToDelete}
        onClose={() => setPurchaseToDelete(null)}
        maxWidth="md"
        title={
          <span className="flex items-center gap-2 text-red-500">
            <AlertTriangle size={20} />
            Excluir Compra
          </span>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setPurchaseToDelete(null)}
              className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-red-600/20 text-xs flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Excluir Definitivamente
            </button>
          </>
        }
      >
        {purchaseToDelete && (
          <div className="space-y-3 font-sans text-xs">
            <p className="text-neutral-300">
              Tem certeza que deseja excluir o registro de compra de <strong className="text-white">{purchaseToDelete.descricaoItem || 'item'}</strong> no valor de <strong className="text-orange-400">R$ {purchaseToDelete.valorPago.toFixed(2)}</strong>?
            </p>
            
            <span className="text-xs text-neutral-500 block bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono">
              ⚠️ Esta ação removerá a compra do histórico e atualizará o lançamento financeiro vinculado.
            </span>
          </div>
        )}
      </Modal>

    </div>
  );
}
