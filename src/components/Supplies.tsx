import React, { useState } from 'react';
import { SupplyItem, PurchaseCategory, SupplyUnit, FilamentType } from '../types';
import { Plus, Search, Box, AlertTriangle, Edit, Trash2, Tag, Sparkles, Package, Cpu, Wrench, ShoppingCart, DollarSign, X } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';
import { DataList } from './ui/DataList';

export default function Supplies() {
  const { useInsumos, useAddInsumo, useUpdateInsumo, useDeleteInsumo } = useData();
  const { data: supplies = [] } = useInsumos();
  const addMutation = useAddInsumo();
  const editMutation = useUpdateInsumo();
  const deleteMutation = useDeleteInsumo();

  const { toast, showToast, hideToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Form Fields
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<PurchaseCategory>('Cola / Adesivo');
  const [unidadeMedida, setUnidadeMedida] = useState<SupplyUnit>('un');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState(5);
  const [custoUnitarioPadrao, setCustoUnitarioPadrao] = useState(10.00);
  const [fornecedorPadrao, setFornecedorPadrao] = useState('');
  const [tipoFilamento, setTipoFilamento] = useState<FilamentType>('PLA');
  const [cor, setCor] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const getCategoryBadge = (cat: PurchaseCategory = 'Outros Insumos') => {
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

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setNome('');
    setCategoria('Cola / Adesivo');
    setUnidadeMedida('un');
    setQuantidadeEstoque(10);
    setEstoqueMinimo(2);
    setCustoUnitarioPadrao(15.00);
    setFornecedorPadrao('');
    setTipoFilamento('PLA');
    setCor('');
    setObservacoes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: SupplyItem) => {
    setEditingItem(item);
    setNome(item.nome);
    setCategoria(item.categoria);
    setUnidadeMedida(item.unidadeMedida || 'un');
    setQuantidadeEstoque(item.quantidadeEstoque || 0);
    setEstoqueMinimo(item.estoqueMinimo !== undefined ? item.estoqueMinimo : 5);
    setCustoUnitarioPadrao(item.custoUnitarioPadrao || 0);
    setFornecedorPadrao(item.fornecedorPadrao || '');
    setTipoFilamento(item.tipoFilamento || 'PLA');
    setCor(item.cor || '');
    setObservacoes(item.observacoes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !categoria) {
      showToast('Preencha o nome do insumo e a categoria.', 'error');
      return;
    }

    const itemData: SupplyItem = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      nome,
      categoria,
      unidadeMedida,
      quantidadeEstoque: Number(quantidadeEstoque),
      estoqueMinimo: Number(estoqueMinimo),
      custoUnitarioPadrao: Number(custoUnitarioPadrao),
      fornecedorPadrao,
      tipoFilamento: categoria === 'Filamento' ? tipoFilamento : undefined,
      cor: categoria === 'Filamento' ? cor : undefined,
      observacoes
    };

    const onSuccess = () => {
      setIsModalOpen(false);
      showToast(editingItem ? 'Insumo atualizado com sucesso!' : 'Insumo cadastrado no catálogo!', 'success');
    };

    const onError = () => showToast('Erro ao salvar insumo.', 'error');

    if (editingItem) {
      editMutation.mutate(itemData, { onSuccess, onError });
    } else {
      addMutation.mutate(itemData, { onSuccess, onError });
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDialog({ open: true, id, name });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(confirmDialog.id, {
      onSuccess: () => showToast('Insumo removido do catálogo.', 'warning'),
      onError: () => showToast('Erro ao excluir insumo.', 'error')
    });
    setConfirmDialog({ open: false, id: '', name: '' });
  };

  // Filter computation
  const filteredSupplies = supplies.filter(s => {
    const catMatch = selectedCategoryFilter === 'all' || s.categoria === selectedCategoryFilter;
    if (!catMatch) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.nome.toLowerCase().includes(q) ||
      (s.fornecedorPadrao && s.fornecedorPadrao.toLowerCase().includes(q)) ||
      (s.observacoes && s.observacoes.toLowerCase().includes(q))
    );
  });

  const lowStockItems = supplies.filter(s => s.quantidadeEstoque <= (s.estoqueMinimo || 2));

  return (
    <div className="space-y-6" id="supplies-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
      <ConfirmDialog
        open={confirmDialog.open}
        title="Excluir Insumo / Material"
        description={`Tem certeza que deseja remover "${confirmDialog.name}" do catálogo de insumos?`}
        confirmLabel="Excluir Insumo"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: '', name: '' })}
      />

      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="supplies-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Catálogo de Insumos & Materiais Diversos</h2>
          <p className="text-sm text-neutral-400 mt-1">Cadastre colas, caixas/embalagens, parafusos, bicos, peças e matérias-primas para selecionar rapidamente ao registrar compras.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          id="add-new-supply-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <Plus size={18} />
          Cadastrar Novo Insumo
        </button>
      </div>

      {/* LOW STOCK ALERT BANNER */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-800 text-amber-200 text-sm rounded-xl flex items-center justify-between gap-4" id="supplies-low-stock-box">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-400 shrink-0" size={20} />
            <div>
              <strong>Atenção Reposição:</strong> Existem <strong>{lowStockItems.length} insumos</strong> com estoque abaixo ou igual ao limite mínimo definido!
              <span className="block text-xs text-amber-300/80 mt-0.5">
                {lowStockItems.slice(0, 3).map(i => `${i.nome} (${i.quantidadeEstoque} ${i.unidadeMedida})`).join(' · ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3" id="supplies-search-bar">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome do insumo, fornecedor ou notas..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500 cursor-pointer"
        >
          <option value="all">Todas as Categorias</option>
          <option value="Cola / Adesivo">Cola / Adesivo</option>
          <option value="Embalagem / Caixas">Embalagem / Caixas</option>
          <option value="Acessórios / Componentes">Acessórios / Componentes</option>
          <option value="Filamento">Filamentos</option>
          <option value="Impressoras 3D">Impressoras 3D</option>
          <option value="Peças de Manutenção / Peças de Impressoras">Peças de Manutenção</option>
          <option value="Outros Insumos">Outros Insumos</option>
        </select>
      </div>

      {/* SUPPLIES DATALIST TABLE */}
      <DataList<SupplyItem>
        data={filteredSupplies}
        rowKey={(item) => item.id}
        columns={[
          {
            key: 'nome',
            header: 'Item / Insumo',
            render: (item) => {
              const badge = getCategoryBadge(item.categoria);
              const IconComp = badge.icon;

              return (
                <div>
                  <span className="font-semibold text-white block">{item.nome}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded flex items-center gap-1 w-fit ${badge.bg}`}>
                      <IconComp size={10} />
                      {badge.label}
                    </span>
                    {item.fornecedorPadrao && (
                      <span className="text-[11px] text-neutral-500">Fornecedor: {item.fornecedorPadrao}</span>
                    )}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'unidade',
            header: 'Unidade',
            align: 'center',
            render: (item) => <span className="font-mono text-neutral-300 text-xs px-2 py-1 bg-neutral-950 border border-neutral-800 rounded">{item.unidadeMedida}</span>,
          },
          {
            key: 'estoque',
            header: 'Estoque Atual',
            align: 'right',
            render: (item) => {
              const isLow = item.quantidadeEstoque <= (item.estoqueMinimo || 2);
              return (
                <div className="text-right font-mono">
                  <span className={`font-bold ${isLow ? 'text-amber-400' : 'text-white'}`}>
                    {item.quantidadeEstoque} {item.unidadeMedida}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">Mín: {item.estoqueMinimo || 0}</span>
                </div>
              );
            },
          },
          {
            key: 'custo',
            header: 'Custo Unitário Est.',
            align: 'right',
            render: (item) => (
              <span className="font-mono font-bold text-orange-400">
                R$ {(item.custoUnitarioPadrao || 0).toFixed(2)}
              </span>
            ),
          },
        ]}
        extraColumns={[
          {
            key: 'observacoes',
            header: 'Observações',
            render: (item) => <span className="text-neutral-300">{item.observacoes || <span className="italic text-neutral-600">—</span>}</span>,
          },
        ]}
        onEdit={handleOpenEditModal}
        onDelete={(item) => handleDelete(item.id, item.nome)}
        emptyMessage={searchQuery ? 'Nenhum insumo encontrado para a pesquisa.' : 'Nenhum insumo cadastrado no catálogo ainda.'}
      />

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="supply-form-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100 font-sans">
            
            {/* STICKY HEADER */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Box size={20} className="text-orange-500" />
                {editingItem ? 'Editar Insumo / Material' : 'Cadastrar Insumo no Catálogo'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Fechar Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 font-mono text-xs flex-1">
                
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Nome do Insumo / Material *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Cola em Bastão Kores 40g / Parafuso M3x10 Inox"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  
                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Categoria *</label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value as PurchaseCategory)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="Cola / Adesivo">Cola / Adesivo de Mesa</option>
                      <option value="Embalagem / Caixas">Embalagem / Caixas</option>
                      <option value="Acessórios / Componentes">Acessórios / Componentes</option>
                      <option value="Filamento">Filamento</option>
                      <option value="Impressoras 3D">Impressora 3D</option>
                      <option value="Peças de Manutenção / Peças de Impressoras">Peça de Impressora / Manutenção</option>
                      <option value="Outros Insumos">Outros Insumos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Unidade de Medida *</label>
                    <select
                      value={unidadeMedida}
                      onChange={(e) => setUnidadeMedida(e.target.value as SupplyUnit)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="un">Unidade (un)</option>
                      <option value="caixa">Caixa</option>
                      <option value="pacote">Pacote</option>
                      <option value="rolo">Rolo</option>
                      <option value="g">Gramas (g)</option>
                      <option value="Kg">Quilos (Kg)</option>
                      <option value="metro">Metro (m)</option>
                      <option value="litro">Litro (l)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Estoque Atual Inicial *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={quantidadeEstoque}
                      onChange={(e) => setQuantidadeEstoque(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Estoque Mínimo (Alerta) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={estoqueMinimo}
                      onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Custo Unitário Estimado (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={custoUnitarioPadrao}
                      onChange={(e) => setCustoUnitarioPadrao(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Fornecedor Principal</label>
                    <input
                      type="text"
                      value={fornecedorPadrao}
                      onChange={(e) => setFornecedorPadrao(e.target.value)}
                      placeholder="Ex: Kalunga / Mercado Livre"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Observações / Especificações</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
                    placeholder="Especificações técnicas, compatibilidade ou marca..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

              </div>

              {/* STICKY ACTIONS FOOTER */}
              <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-orange-600/20"
                >
                  Salvar Insumo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
