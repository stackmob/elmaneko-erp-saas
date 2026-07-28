import React, { useState } from 'react';
import { Purchase, PurchaseCategory, Filament } from '../types';
import { Plus, ShoppingCart, Calendar, Building, DollarSign, FileText, Search, Tag, Package, Cpu, Wrench, Box, Sparkles, Filter } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';

export default function Purchases() {
  const { useCompras, useFilamentos, useAddCompra } = useData();
  const { data: purchases = [] } = useCompras();
  const { data: filaments = [] } = useFilamentos();
  const addMutation = useAddCompra();
  const { toast, showToast, hideToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form fields
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [categoriaItem, setCategoriaItem] = useState<PurchaseCategory>('Filamento');
  const [descricaoItem, setDescricaoItem] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [fornecedor, setFornecedor] = useState('');
  const [filamentoId, setFilamentoId] = useState('');
  const [quantidadeAdquirida, setQuantidadeAdquirida] = useState(1000);
  const [valorPago, setValorPago] = useState(120.00);
  const [notaFiscal, setNotaFiscal] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const handleOpenModal = () => {
    setData(new Date().toISOString().split('T')[0]);
    setCategoriaItem('Filamento');
    setDescricaoItem('');
    setQuantidade(1);
    setFornecedor('');
    setFilamentoId(filaments.length > 0 ? filaments[0].id : '');
    setQuantidadeAdquirida(1000);
    setValorPago(120.00);
    setNotaFiscal('');
    setObservacoes('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedor || valorPago < 0) {
      showToast('Por favor, preencha o fornecedor e valor pago.', 'error');
      return;
    }

    if (categoriaItem === 'Filamento' && !filamentoId) {
      showToast('Selecione o filamento a ser creditado no estoque.', 'error');
      return;
    }

    if (categoriaItem !== 'Filamento' && !descricaoItem) {
      showToast('Informe a descrição do item ou insumo adquirido.', 'error');
      return;
    }

    const newPurchase: Purchase = {
      id: crypto.randomUUID(),
      data,
      fornecedor,
      categoriaItem,
      descricaoItem: categoriaItem !== 'Filamento' ? descricaoItem : undefined,
      quantidade: categoriaItem !== 'Filamento' ? Number(quantidade) : 1,
      filamentoId: categoriaItem === 'Filamento' ? filamentoId : undefined,
      quantidadeAdquirida: categoriaItem === 'Filamento' ? Number(quantidadeAdquirida) : 0,
      valorPago: Number(valorPago),
      notaFiscal,
      observacoes
    };

    addMutation.mutate(newPurchase, {
      onSuccess: () => {
        setIsModalOpen(false);
        showToast(
          categoriaItem === 'Filamento'
            ? 'Compra salva e estoque de filamento creditado!'
            : 'Compra registrada com sucesso!',
          'success'
        );
      },
      onError: () => showToast('Erro ao registrar compra.', 'error')
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
  const filteredPurchases = purchases.filter(p => {
    const catMatch = selectedCategoryFilter === 'all' || (p.categoriaItem || 'Filamento') === selectedCategoryFilter;
    if (!catMatch) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const filamentObj = filaments.find(f => f.id === p.filamentoId);
    return (
      (p.fornecedor && p.fornecedor.toLowerCase().includes(q)) ||
      (p.descricaoItem && p.descricaoItem.toLowerCase().includes(q)) ||
      (p.notaFiscal && p.notaFiscal.toLowerCase().includes(q)) ||
      (filamentObj && filamentObj.nome.toLowerCase().includes(q))
    );
  });

  const totalSpent = filteredPurchases.reduce((acc, p) => acc + p.valorPago, 0);
  const totalFilamentGrams = filteredPurchases
    .filter(p => (p.categoriaItem || 'Filamento') === 'Filamento')
    .reduce((acc, p) => acc + (p.quantidadeAdquirida || 0), 0);

  return (
    <div className="space-y-6" id="purchases-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />

      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="purchases-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Controle de Compras & Gestão de Insumos</h2>
          <p className="text-sm text-neutral-400 mt-1">Registre aquisições de filamentos, embalagens, colas, acessórios, peças de manutenção e impressoras 3D.</p>
        </div>
        <button
          onClick={handleOpenModal}
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
            <div className="text-xs font-mono text-neutral-400 uppercase">Investimento Total Filtrado</div>
            <div className="text-xl font-black text-white mt-1">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <Box size={22} />
          </div>
          <div>
            <div className="text-xs font-mono text-neutral-400 uppercase">Filamentos Comprados</div>
            <div className="text-xl font-black text-white mt-1">{(totalFilamentGrams / 1000).toFixed(2)} <span className="text-sm font-normal text-neutral-400">Kg</span></div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <ShoppingCart size={22} />
          </div>
          <div>
            <div className="text-xs font-mono text-neutral-400 uppercase">Registros de Compra</div>
            <div className="text-xl font-black text-white mt-1">{filteredPurchases.length} <span className="text-sm font-normal text-neutral-400">lotes</span></div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row gap-3" id="purchases-filters">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por fornecedor, descrição, nota fiscal..."
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
            <option value="Filamento">Filamento</option>
            <option value="Cola / Adesivo">Cola / Adesivo</option>
            <option value="Embalagem / Caixas">Embalagem / Caixas</option>
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
                <th className="py-4 px-4 font-semibold text-right">Qtd / Peso</th>
                <th className="py-4 px-4 font-semibold text-right">Valor Pago</th>
                <th className="py-4 px-4 font-semibold">Nota Fiscal</th>
                <th className="py-4 px-4 font-semibold">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-300 font-mono">
              {filteredPurchases.length > 0 ? (
                [...filteredPurchases].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(p => {
                  const catBadge = getCategoryBadge(p.categoriaItem);
                  const IconComp = catBadge.icon;
                  const filamentObj = filaments.find(f => f.id === p.filamentoId);

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
                        {(p.categoriaItem || 'Filamento') === 'Filamento' ? (
                          filamentObj ? (
                            <div>
                              <span className="text-white font-semibold block">{filamentObj.nome}</span>
                              <span className="text-[11px] text-neutral-500">Tipo: {filamentObj.tipo} • Cor: {filamentObj.cor}</span>
                            </div>
                          ) : (
                            <span className="text-red-400 italic">Filamento não encontrado</span>
                          )
                        ) : (
                          <div>
                            <span className="text-white font-semibold block">{p.descricaoItem || 'Sem descrição'}</span>
                            <span className="text-[11px] text-neutral-500">Unidades: {p.quantidade || 1}</span>
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
                        {(p.categoriaItem || 'Filamento') === 'Filamento' ? (
                          <span>{p.quantidadeAdquirida || 0} <span className="text-xs font-normal text-neutral-400">g</span></span>
                        ) : (
                          <span>{p.quantidade || 1} <span className="text-xs font-normal text-neutral-400">un</span></span>
                        )}
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
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 text-xs">
                    Nenhuma compra encontrada para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="purchase-form-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingCart size={20} className="text-orange-500" />
              Registrar Compra de Insumos & Peças
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              
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

                {/* Categoria do Insumo */}
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Categoria do Item *</label>
                  <select
                    value={categoriaItem}
                    onChange={(e) => setCategoriaItem(e.target.value as PurchaseCategory)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer font-bold"
                  >
                    <option value="Filamento">Filamento (Credita Estoque)</option>
                    <option value="Cola / Adesivo">Cola / Adesivo de Mesa</option>
                    <option value="Embalagem / Caixas">Embalagem / Caixas</option>
                    <option value="Acessórios / Componentes">Acessórios / Componentes</option>
                    <option value="Impressoras 3D">Impressoras 3D</option>
                    <option value="Peças de Manutenção / Peças de Impressoras">Peças de Impressora / Manutenção</option>
                    <option value="Outros Insumos">Outros Insumos</option>
                  </select>
                </div>

                {/* Dynamic fields according to Category */}
                {categoriaItem === 'Filamento' ? (
                  <>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Selecione o Filamento *</label>
                      <select
                        value={filamentoId}
                        onChange={(e) => setFilamentoId(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {filaments.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.nome} ({f.tipo} - {f.cor})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Peso Adquirido (g) *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={quantidadeAdquirida}
                        onChange={(e) => setQuantidadeAdquirida(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Descrição do Item *</label>
                      <input
                        type="text"
                        required
                        value={descricaoItem}
                        onChange={(e) => setDescricaoItem(e.target.value)}
                        placeholder="Ex: Cola Bastão 40g / Parafusos M3"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Quantidade (Unidades) *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={quantidade}
                        onChange={(e) => setQuantidade(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </>
                )}

                {/* Fornecedor */}
                <div className="col-span-2">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Fornecedor *</label>
                  <input
                    type="text"
                    required
                    value={fornecedor}
                    onChange={(e) => setFornecedor(e.target.value)}
                    placeholder="Ex: 3D Fila, Mercado Livre, Creality Direct"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Valor Pago */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Valor Total Pago R$ *</label>
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
                    placeholder="Ex: NF-e 49201"
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
                    placeholder="Comentários sobre a compra ou garantia..."
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
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
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-orange-600/20"
                >
                  {categoriaItem === 'Filamento' ? 'Salvar e Creditar Filamento' : 'Salvar Registro de Compra'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
