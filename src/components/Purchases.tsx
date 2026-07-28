import React, { useState } from 'react';
import { Purchase, Filament } from '../types';
import { Plus, ShoppingCart, Calendar, Building, DollarSign, FileText, FileSearch } from 'lucide-react';
import { useData } from '../hooks/useData';

export default function Purchases() {
  const { useCompras, useFilamentos, useAddCompra } = useData();
  const { data: purchases = [] } = useCompras();
  const { data: filaments = [] } = useFilamentos();
  const addMutation = useAddCompra();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form fields
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [fornecedor, setFornecedor] = useState('');
  const [filamentoId, setFilamentoId] = useState('');
  const [quantidadeAdquirida, setQuantidadeAdquirida] = useState(1000);
  const [valorPago, setValorPago] = useState(120.00);
  const [notaFiscal, setNotaFiscal] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const handleOpenModal = () => {
    setData(new Date().toISOString().split('T')[0]);
    setFornecedor('');
    // select first filament as default
    setFilamentoId(filaments.length > 0 ? filaments[0].id : '');
    setQuantidadeAdquirida(1000);
    setValorPago(120.00);
    setNotaFiscal('');
    setObservacoes('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedor || !filamentoId || quantidadeAdquirida <= 0 || valorPago < 0) {
      alert('Por favor, informe todos os campos obrigatórios com valores válidos.');
      return;
    }

    const newPurchase: Purchase = {
      id: crypto.randomUUID(),
      data,
      fornecedor,
      filamentoId,
      quantidadeAdquirida: Number(quantidadeAdquirida),
      valorPago: Number(valorPago),
      notaFiscal,
      observacoes
    };

    addMutation.mutate(newPurchase);
    setIsModalOpen(false);
  };

  const totalSpent = purchases.reduce((acc, p) => acc + p.valorPago, 0);
  const totalGramsPurchased = purchases.reduce((acc, p) => acc + p.quantidadeAdquirida, 0);

  return (
    <div className="space-y-6" id="purchases-module-container">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="purchases-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Controle de Compras (Insumos)</h2>
          <p className="text-sm text-neutral-400 mt-1">Registre a aquisição de novos lotes de filamentos. O saldo do estoque será incrementado automaticamente.</p>
        </div>
        <button
          onClick={handleOpenModal}
          disabled={filaments.length === 0}
          id="add-new-purchase-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Registrar Compra
        </button>
      </div>

      {filaments.length === 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-800 text-amber-200 text-sm rounded-xl" id="no-filament-warning-box">
          ⚠️ <strong>Atenção:</strong> Você precisa cadastrar pelo menos uma bobina no menu <strong>Filamentos</strong> antes de registrar compras de estoque.
        </div>
      )}

      {/* INVESTMENT METRICS BOX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="purchases-kpis">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <DollarSign size={22} />
          </div>
          <div>
            <div className="text-xs font-mono text-neutral-400 uppercase">Investimento Acumulado</div>
            <div className="text-xl font-black text-white mt-1">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <ShoppingCart size={22} />
          </div>
          <div>
            <div className="text-xs font-mono text-neutral-400 uppercase">Quantidade Comprada</div>
            <div className="text-xl font-black text-white mt-1">{(totalGramsPurchased / 1000).toFixed(2)} <span className="text-sm font-normal text-neutral-400">Kg</span></div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <FileText size={22} />
          </div>
          <div>
            <div className="text-xs font-mono text-neutral-400 uppercase">Lotes Registrados</div>
            <div className="text-xl font-black text-white mt-1">{purchases.length} <span className="text-sm font-normal text-neutral-400">lotes</span></div>
          </div>
        </div>
      </div>

      {/* CHRONOLOGICAL PURCHASES LEDGER */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl" id="purchases-table-box">
        <div className="p-4 bg-neutral-950/40 border-b border-neutral-800 flex justify-between items-center">
          <h3 className="text-xs font-mono uppercase text-neutral-400 tracking-wider font-semibold">Histórico de Compras de Estoque</h3>
          <span className="text-xs text-neutral-500 font-mono">Ordenado por data (mais recente primeiro)</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="purchases-table">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/20 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                <th className="py-4 px-4 font-semibold">Data</th>
                <th className="py-4 px-4 font-semibold">Fornecedor</th>
                <th className="py-4 px-4 font-semibold">Insumo / Filamento</th>
                <th className="py-4 px-4 font-semibold text-right">Peso Adquirido</th>
                <th className="py-4 px-4 font-semibold text-right">Valor Pago</th>
                <th className="py-4 px-4 font-semibold">Nota Fiscal</th>
                <th className="py-4 px-4">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-300">
              {purchases.length > 0 ? (
                // sort chronologically descending
                [...purchases].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(p => {
                  const filamentObj = filaments.find(f => f.id === p.filamentoId);
                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/10 transition-colors" id={`row-purchase-${p.id}`}>
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1 text-neutral-400">
                          <Calendar size={12} />
                          {p.data}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          <Building size={14} className="text-neutral-500" />
                          {p.fornecedor}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {filamentObj ? (
                          <div className="flex flex-col">
                            <span className="text-white font-semibold">{filamentObj.nome}</span>
                            <span className="text-xs text-neutral-500 font-mono">Tipo: {filamentObj.tipo} • Cor: {filamentObj.cor}</span>
                          </div>
                        ) : (
                          <span className="text-red-400 italic">Filamento removido</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {p.quantidadeAdquirida} <span className="text-xs font-normal text-neutral-400">g</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-orange-400">
                        R$ {p.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-400">
                        {p.notaFiscal ? (
                          <span className="bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded text-white">
                            {p.notaFiscal}
                          </span>
                        ) : (
                          <span className="text-neutral-600 font-light">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-neutral-400 max-w-xs truncate" title={p.observacoes}>
                        {p.observacoes || <span className="text-neutral-600 italic">Nenhuma observação</span>}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono text-xs">
                    Nenhuma compra de estoque registrada ainda. Clique em "Registrar Compra" para adicionar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="purchase-form-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingCart size={20} className="text-orange-500" />
              Registrar Compra de Filamento
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              
              <div className="grid grid-cols-2 gap-4">
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

                <div>
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

                <div className="col-span-2">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Fornecedor *</label>
                  <input
                    type="text"
                    required
                    value={fornecedor}
                    onChange={(e) => setFornecedor(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
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

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Valor Total Pago R$ *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={valorPago}
                    onChange={(e) => setValorPago(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Número da Nota Fiscal (opcional)</label>
                  <input
                    type="text"
                    value={notaFiscal}
                    onChange={(e) => setNotaFiscal(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Observações</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
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
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Salvar e Creditar Estoque
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
