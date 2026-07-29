import React, { useState } from 'react';
import { Filament, FilamentType } from '../types';
import { Plus, Edit, Trash2, Search, Filter, AlertTriangle, X } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';

export default function Filaments() {
  const { useFilamentos, useAddFilamento, useUpdateFilamento, useDeleteFilamento } = useData();
  const { data: filaments = [] } = useFilamentos();
  const addMutation = useAddFilamento();
  const editMutation = useUpdateFilamento();
  const deleteMutation = useDeleteFilamento();
  const { toast, showToast, hideToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  
  // States
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterBrand, setFilterBrand] = useState<string>('todos');
  
  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
  
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<FilamentType>('PLA');
  const [marca, setMarca] = useState('');
  const [cor, setCor] = useState('');
  const [pesoTotal, setPesoTotal] = useState(1000);
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState(1000);
  const [valorCompra, setValorCompra] = useState(120.00);
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
  const [fornecedor, setFornecedor] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Extract unique brands for the filter
  const brands = Array.from(new Set(filaments.map(f => f.marca)));

  // Filtered filaments
  const filteredFilaments = filaments.filter(f => {
    const matchesSearch = f.nome.toLowerCase().includes(search.toLowerCase()) || 
                          f.cor.toLowerCase().includes(search.toLowerCase()) ||
                          f.fornecedor.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'todos' || f.tipo === filterType;
    const matchesBrand = filterBrand === 'todos' || f.marca === filterBrand;
    return matchesSearch && matchesType && matchesBrand;
  });

  // KPI Calculations
  const totalWeight = filaments.reduce((acc, f) => acc + f.quantidadeDisponivel, 0);
  const totalValue = filaments.reduce((acc, f) => acc + (f.quantidadeDisponivel * (f.valorCompra / f.pesoTotal)), 0);
  const lowStockCount = filaments.filter(f => f.quantidadeDisponivel < 200).length;

  const handleOpenAddModal = () => {
    setEditingFilament(null);
    setNome('');
    setTipo('PLA');
    setMarca('');
    setCor('');
    setPesoTotal(1000);
    setQuantidadeDisponivel(1000);
    setValorCompra(120.00);
    setDataCompra(new Date().toISOString().split('T')[0]);
    setFornecedor('');
    setObservacoes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (f: Filament) => {
    setEditingFilament(f);
    setNome(f.nome);
    setTipo(f.tipo);
    setMarca(f.marca);
    setCor(f.cor);
    setPesoTotal(f.pesoTotal);
    setQuantidadeDisponivel(f.quantidadeDisponivel);
    setValorCompra(f.valorCompra);
    setDataCompra(f.dataCompra);
    setFornecedor(f.fornecedor);
    setObservacoes(f.observacoes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !marca || !cor || !fornecedor) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const filamentData: Filament = {
      id: editingFilament ? editingFilament.id : crypto.randomUUID(),
      nome,
      tipo,
      marca,
      cor,
      pesoTotal: Number(pesoTotal),
      quantidadeDisponivel: Number(quantidadeDisponivel),
      valorCompra: Number(valorCompra),
      dataCompra,
      fornecedor,
      observacoes
    };

    const onSuccess = () => {
      setIsModalOpen(false);
      showToast(editingFilament ? 'Filamento atualizado com sucesso!' : 'Filamento cadastrado com sucesso!', 'success');
    };
    const onError = () => showToast('Erro ao salvar filamento. Tente novamente.', 'error');

    if (editingFilament) {
      editMutation.mutate(filamentData, { onSuccess, onError });
    } else {
      addMutation.mutate(filamentData, { onSuccess, onError });
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDialog({ open: true, id, name });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(confirmDialog.id, {
      onSuccess: () => showToast('Filamento excluído.', 'warning'),
      onError: () => showToast('Erro ao excluir filamento.', 'error')
    });
    setConfirmDialog({ open: false, id: '', name: '' });
  };

  return (
    <div className="space-y-6" id="filaments-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
      <ConfirmDialog
        open={confirmDialog.open}
        title="Excluir Filamento"
        description={`Tem certeza de que deseja excluir "${confirmDialog.name}"? Esta ação removerá a bobina e afetará o histórico.`}
        confirmLabel="Excluir Bobina"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: '', name: '' })}
      />
      
      {/* 1. MODULE ACTIONS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="filaments-header-box">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Estoque de Filamentos</h2>
          <p className="text-sm text-neutral-400 mt-1">Gerencie os insumos de PLA, PETG, ABS e TPU com cálculo de custo unitário por grama.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          id="add-new-filament-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <Plus size={18} />
          Cadastrar Bobina
        </button>
      </div>

      {/* 2. STATS & ANALYTICS LATERAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="filaments-grid-layout">
        
        {/* KPI SIDEBAR (1/4 width on desktop) */}
        <div className="space-y-4 lg:col-span-1" id="filaments-sidebar-analytics">
          
          {/* TOTAL ESTOQUE */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5" id="filament-sidebar-weight">
            <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider font-semibold mb-2">Estoque Total</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{(totalWeight / 1000).toFixed(2)}</span>
              <span className="text-sm text-neutral-400 font-mono">Kg</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2 font-mono">Total de filamento físico disponível para manufatura.</p>
          </div>

          {/* VALOR DO ESTOQUE */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5" id="filament-sidebar-valuation">
            <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider font-semibold mb-2">Valor Estimado</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-orange-500 font-mono font-bold">R$</span>
              <span className="text-3xl font-black text-white">{totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2 font-mono">Valor de compra ponderado pelas gramas remanescentes.</p>
          </div>

          {/* ALERTAS DE ESTOQUE BAIXO */}
          <div className={`border rounded-xl p-5 transition-all duration-300 ${lowStockCount > 0 ? 'bg-red-950/20 border-red-900 text-red-200' : 'bg-neutral-900 border-neutral-800 text-neutral-300'}`} id="filament-sidebar-alerts">
            <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider font-semibold mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} className={lowStockCount > 0 ? 'text-red-500 animate-bounce' : 'text-neutral-500'} />
              Bobinas Baixas
            </h4>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black ${lowStockCount > 0 ? 'text-red-500' : 'text-white'}`}>{lowStockCount}</span>
              <span className="text-sm text-neutral-400 font-mono">unid.</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2 font-mono">
              {lowStockCount > 0 ? (
                <span className="text-red-400 font-semibold">Bobinas abaixo de 200g requerem nova compra em breve para evitar interrupções de produção!</span>
              ) : (
                'Todas as bobinas possuem nível operacional seguro (>200g).'
              )}
            </p>
          </div>

          {/* STOCK DISTRIBUTION BY TYPE */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3" id="filament-sidebar-type-distribution">
            <h4 className="text-xs font-mono uppercase text-neutral-400 tracking-wider font-semibold">Saldo por Polímero</h4>
            {['PLA', 'PETG', 'ABS', 'TPU'].map(tp => {
              const weightForType = filaments.filter(f => f.tipo === tp).reduce((acc, f) => acc + f.quantidadeDisponivel, 0);
              const maxWeight = 3000; // Reference for progress bar
              const percentage = Math.min((weightForType / maxWeight) * 100, 100);
              return (
                <div key={tp} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white font-semibold">{tp}</span>
                    <span className="text-neutral-400">{weightForType} g</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden border border-neutral-800">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* MAIN CRUD TABLE & FILTERS (3/4 width on desktop) */}
        <div className="space-y-4 lg:col-span-3" id="filaments-main-list">
          
          {/* SEARCH & FILTER CONTROLS */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row gap-3" id="filaments-filters-bar">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input
                type="text"
                placeholder="Pesquisar por produto, cor ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                id="filament-search-input"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5" id="filter-type-box">
              <Filter size={14} className="text-orange-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent text-xs text-neutral-300 focus:outline-none font-semibold uppercase cursor-pointer"
                id="filament-type-filter"
              >
                <option value="todos" className="bg-neutral-900">Todos os Tipos</option>
                <option value="PLA" className="bg-neutral-900">PLA</option>
                <option value="PETG" className="bg-neutral-900">PETG</option>
                <option value="ABS" className="bg-neutral-900">ABS</option>
                <option value="TPU" className="bg-neutral-900">TPU</option>
              </select>
            </div>

            {/* Brand Filter */}
            <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5" id="filter-brand-box">
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="bg-transparent text-xs text-neutral-300 focus:outline-none font-semibold cursor-pointer"
                id="filament-brand-filter"
              >
                <option value="todos" className="bg-neutral-900">Todas as Marcas</option>
                {brands.map(brand => (
                  <option key={brand} value={brand} className="bg-neutral-900">{brand}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl" id="filaments-table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="filaments-data-table">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/50 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    <th className="py-4 px-4 font-semibold">Produto</th>
                    <th className="py-4 px-4 font-semibold">Tipo</th>
                    <th className="py-4 px-4 font-semibold">Marca / Cor</th>
                    <th className="py-4 px-4 font-semibold text-right">Saldo Disponível</th>
                    <th className="py-4 px-4 font-semibold text-right">Valor Compra</th>
                    <th className="py-4 px-4 font-semibold text-right">Valor / Grama</th>
                    <th className="py-4 px-4 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-300">
                  {filteredFilaments.length > 0 ? (
                    filteredFilaments.map(f => {
                      const valuePerGram = f.valorCompra / f.pesoTotal;
                      const isLow = f.quantidadeDisponivel < 200;

                      return (
                        <tr key={f.id} className="hover:bg-neutral-800/20 transition-colors" id={`row-filament-${f.id}`}>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{f.nome}</div>
                            <div className="text-xs text-neutral-500 font-mono">Fornecedor: {f.fornecedor}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md ${
                              f.tipo === 'PLA' ? 'bg-orange-950/60 border border-orange-500/20 text-orange-400' :
                              f.tipo === 'PETG' ? 'bg-amber-950/60 border border-amber-500/20 text-amber-400' :
                              f.tipo === 'ABS' ? 'bg-red-950/60 border border-red-500/20 text-red-400' :
                              'bg-zinc-850 border border-zinc-500/20 text-zinc-300'
                            }`}>
                              {f.tipo}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-neutral-200">{f.marca}</div>
                            <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full border border-neutral-700 inline-block" style={{ backgroundColor: f.cor.toLowerCase() === 'transparente' ? 'rgba(255,255,255,0.2)' : f.cor }} />
                              {f.cor}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className={`font-mono font-bold ${isLow ? 'text-red-500' : 'text-white'}`}>
                              {f.quantidadeDisponivel} <span className="text-xs font-normal text-neutral-400">g</span>
                            </div>
                            <div className="text-xs text-neutral-500 font-mono">de {f.pesoTotal}g</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            R$ {f.valorCompra.toFixed(2)}
                            <div className="text-[10px] text-neutral-500 font-mono">{f.dataCompra}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-orange-400 font-bold">
                            R$ {valuePerGram.toFixed(4)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEditModal(f)}
                                className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Editar bobina"
                                id={`edit-fil-btn-${f.id}`}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(f.id, f.nome)}
                                className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                title="Excluir bobina"
                                id={`delete-fil-btn-${f.id}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono text-xs">
                        Nenhuma bobina de filamento localizada com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* 3. MODAL FOR NEW/EDIT FILAMENT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="filament-form-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100 font-sans">
            
            {/* STICKY HEADER */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
                {editingFilament ? 'Editar Filamento / Bobina' : 'Cadastrar Novo Filamento'}
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="col-span-2">
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Nome do Produto *</label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Tipo do Filamento *</label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as FilamentType)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="PLA">PLA</option>
                      <option value="PETG">PETG</option>
                      <option value="ABS">ABS</option>
                      <option value="TPU">TPU</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Marca *</label>
                    <input
                      type="text"
                      required
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Cor *</label>
                    <input
                      type="text"
                      required
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      placeholder="Ex: Preto Cadmus"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Peso Inicial Total (g) *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={pesoTotal}
                      onChange={(e) => setPesoTotal(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Quantidade Disponível (g) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={quantidadeDisponivel}
                      onChange={(e) => setQuantidadeDisponivel(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Valor Total da Compra (R$) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min={0}
                      value={valorCompra}
                      onChange={(e) => setValorCompra(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Data da Compra *</label>
                    <input
                      type="date"
                      required
                      value={dataCompra}
                      onChange={(e) => setDataCompra(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Fornecedor / Loja</label>
                    <input
                      type="text"
                      value={fornecedor}
                      onChange={(e) => setFornecedor(e.target.value)}
                      placeholder="Ex: 3D Fila / Voolt3D / Mercado Livre"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Observações Rápidas</label>
                    <input
                      type="text"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Ex: Temp bico 215C, Mesa 60C"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* AUTOMATIC VALUE PER GRAM INDICATOR */}
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex justify-between items-center text-xs font-mono">
                  <span className="text-neutral-400">VALOR ESTIMADO POR GRAMA:</span>
                  <span className="text-orange-500 font-bold">
                    R$ {pesoTotal > 0 ? (valorCompra / pesoTotal).toFixed(4) : '0.0000'} / g
                  </span>
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
                  {editingFilament ? 'Salvar Alterações' : 'Salvar Cadastro'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
