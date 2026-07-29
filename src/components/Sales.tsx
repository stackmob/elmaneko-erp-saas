import React, { useState } from 'react';
import { Sale, Client, Product, Filament } from '../types';
import { 
  DollarSign, Calendar, User, TrendingUp, AlertCircle, CheckCircle, 
  XCircle, Filter, ShoppingBag, Eye, CreditCard, ChevronRight, Trash2,
  ArrowUpDown, RotateCcw
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';

// Helper to format ISO YYYY-MM-DD date to DD/MM/YYYY
const formatDateBR = (dateStr?: string): string => {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export default function Sales() {
  const { useVendas, useClientes, useProdutos, useUpdateVenda, useDeleteVenda, useOrcamentos, useUpdateOrcamento } = useData();
  const { data: sales = [] } = useVendas();
  const { data: clients = [] } = useClientes();
  const { data: products = [] } = useProdutos();
  const { data: budgets = [] } = useOrcamentos();
  const updateVendaMutation = useUpdateVenda();
  const deleteVendaMutation = useDeleteVenda();
  const updateOrcamentoMutation = useUpdateOrcamento();
  const { toast, showToast, hideToast } = useToast();

  // FILTERS & SORT STATES
  const [filterClient, setFilterClient] = useState('todos');
  const [filterPayment, setFilterPayment] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minValor, setMinValor] = useState('');
  const [maxValor, setMaxValor] = useState('');
  const [sortBy, setSortBy] = useState<'data_desc' | 'data_asc' | 'cliente_asc' | 'cliente_desc' | 'valor_desc' | 'valor_asc'>('data_desc');

  // Filter & Sort Sales list
  const filteredAndSortedSales = sales.filter(s => {
    const matchesClient = filterClient === 'todos' || s.clienteId === filterClient;
    const matchesPayment = filterPayment === 'todos' || s.formaPagamento === filterPayment;
    const matchesStatus = filterStatus === 'todos' || s.statusPagamento === filterStatus;
    const matchesStartDate = !startDate || s.dataVenda >= startDate;
    const matchesEndDate = !endDate || s.dataVenda <= endDate;
    const matchesMinVal = minValor === '' || s.valorTotal >= Number(minValor);
    const matchesMaxVal = maxValor === '' || s.valorTotal <= Number(maxValor);

    return matchesClient && matchesPayment && matchesStatus && matchesStartDate && matchesEndDate && matchesMinVal && matchesMaxVal;
  }).sort((a, b) => {
    const clientA = (clients.find(c => c.id === a.clienteId)?.nome || '').toLowerCase();
    const clientB = (clients.find(c => c.id === b.clienteId)?.nome || '').toLowerCase();

    switch (sortBy) {
      case 'data_desc':
        return b.dataVenda.localeCompare(a.dataVenda) || b.numero.localeCompare(a.numero);
      case 'data_asc':
        return a.dataVenda.localeCompare(b.dataVenda) || a.numero.localeCompare(b.numero);
      case 'cliente_asc':
        return clientA.localeCompare(clientB);
      case 'cliente_desc':
        return clientB.localeCompare(clientA);
      case 'valor_desc':
        return b.valorTotal - a.valorTotal;
      case 'valor_asc':
        return a.valorTotal - b.valorTotal;
      default:
        return b.dataVenda.localeCompare(a.dataVenda);
    }
  });

  // KPIS TOTALIZED ON FILTERED SALES
  const paidSales = filteredAndSortedSales.filter(s => s.statusPagamento === 'Pago');
  const pendingSales = filteredAndSortedSales.filter(s => s.statusPagamento === 'Pendente');
  const cancelledSales = filteredAndSortedSales.filter(s => s.statusPagamento === 'Cancelado');

  const totalFaturadoVal = paidSales.reduce((acc, s) => acc + s.valorTotal, 0);
  const totalPendenteVal = pendingSales.reduce((acc, s) => acc + s.valorTotal, 0);
  const averageTicket = paidSales.length > 0 ? totalFaturadoVal / paidSales.length : 0;

  const handleDeleteSale = (s: Sale) => {
    if (confirm(`Deseja realmente excluir a venda ${s.numero}? O orçamento de origem voltará a ficar PENDENTE.`)) {
      deleteVendaMutation.mutate(s.id);
      if (s.orcamentoOrigemId) {
        const origBudget = budgets.find(b => b.id === s.orcamentoOrigemId);
        if (origBudget) {
          updateOrcamentoMutation.mutate({ ...origBudget, status: 'Aberto' });
        }
      }
      showToast(`Venda ${s.numero} excluída com sucesso! Orçamento de origem retornado para o status Pendente.`, 'success');
    }
  };

  return (
    <div className="space-y-6" id="sales-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
      
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="sales-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Vendas e Faturamento Realizado</h2>
          <p className="text-sm text-neutral-400 mt-1 font-sans">Acompanhe a receita líquida realizada, status de recebimento de Pix ou cartões e gerencie cobranças.</p>
        </div>
      </div>

      {/* FILTER & SORT BAR ROW */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3" id="sales-filters">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
          <span className="text-xs font-mono font-bold uppercase text-neutral-300 flex items-center gap-1.5">
            <Filter size={14} className="text-orange-500" /> Filtros e Ordenação de Vendas
          </span>
          {(filterClient !== 'todos' || filterPayment !== 'todos' || filterStatus !== 'todos' || startDate || endDate || minValor !== '' || maxValor !== '' || sortBy !== 'data_desc') && (
            <button
              onClick={() => {
                setFilterClient('todos');
                setFilterPayment('todos');
                setFilterStatus('todos');
                setStartDate('');
                setEndDate('');
                setMinValor('');
                setMaxValor('');
                setSortBy('data_desc');
              }}
              className="text-[11px] font-mono text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5 font-mono text-xs">
          {/* Cliente */}
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Cliente</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="todos">Todos Clientes</option>
              {clients.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.nome}</option>
              ))}
            </select>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Meio Pgto</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="todos">Todas Formas</option>
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Boleto">Boleto Bancário</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </div>

          {/* Status Pagamento */}
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="todos">Qualquer Status</option>
              <option value="Pago">Pago (Liquidado)</option>
              <option value="Pendente">Pendente (Aberto)</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {/* Data De / Até */}
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Data De</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Data Até</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Valor Range */}
          <div className="flex gap-1.5">
            <div className="flex-1">
              <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Val. Mín</label>
              <input
                type="number"
                placeholder="R$ 0"
                value={minValor}
                onChange={(e) => setMinValor(e.target.value)}
                className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">Val. Máx</label>
              <input
                type="number"
                placeholder="R$ Max"
                value={maxValor}
                onChange={(e) => setMaxValor(e.target.value)}
                className="w-full px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Ordenar Por */}
          <div>
            <label className="block text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <ArrowUpDown size={10} /> Ordenar Por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="data_desc">Data (Mais Recentes)</option>
              <option value="data_asc">Data (Mais Antigos)</option>
              <option value="cliente_asc">Cliente (A-Z)</option>
              <option value="cliente_desc">Cliente (Z-A)</option>
              <option value="valor_desc">Valor (Maior p/ Menor)</option>
              <option value="valor_asc">Valor (Menor p/ Maior)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SALES JOURNAL TABLE */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl" id="sales-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="sales-table">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/20 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                <th className="py-4 px-4 font-semibold">Nota Venda</th>
                <th className="py-4 px-4 font-semibold">Data Fatura</th>
                <th className="py-4 px-4 font-semibold">Cliente Proprietário</th>
                <th className="py-4 px-4 font-semibold">Produtos Faturados</th>
                <th className="py-4 px-4 font-semibold text-center">Meio Pgto</th>
                <th className="py-4 px-4 text-right">Faturamento Total</th>
                <th className="py-4 px-4 text-center">Status Pagamento</th>
                <th className="py-4 px-4 text-center">Controles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-300">
              {filteredAndSortedSales.length > 0 ? (
                filteredAndSortedSales.map(s => {
                  const client = clients.find(cl => cl.id === s.clienteId);

                  return (
                    <tr key={s.id} className="hover:bg-neutral-800/10 transition-colors" id={`row-sale-${s.id}`}>
                      <td className="py-3.5 px-4 font-mono font-black text-white">
                        {s.numero}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-400 whitespace-nowrap">
                        {formatDateBR(s.dataVenda)}
                      </td>
                      <td className="py-3.5 px-4">
                        {client ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{client.nome}</span>
                            <span className="text-xs text-neutral-500">{client.whatsapp}</span>
                          </div>
                        ) : (
                          <span className="text-red-400 italic">Cliente excluído</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono max-w-xs truncate">
                        {s.itens.map((it, idx) => {
                          const p = products.find(prod => prod.id === it.produtoId);
                          return (
                            <span key={idx} className="block text-neutral-300">
                              • {it.quantidade}x {p ? p.nome : 'Peça'} (R$ {(it.valorUnitario - it.desconto).toFixed(2)})
                            </span>
                          );
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-neutral-950 text-neutral-300 border border-neutral-800 rounded-md">
                          <CreditCard size={11} className="text-orange-500" />
                          {s.formaPagamento}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-orange-400">
                        R$ {s.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                          s.statusPagamento === 'Pago' ? 'bg-emerald-950/60 border border-emerald-500/20 text-emerald-400' :
                          s.statusPagamento === 'Pendente' ? 'bg-orange-950/60 border border-orange-500/20 text-orange-400 animate-pulse' :
                          'bg-red-950/60 border border-red-500/20 text-red-400'
                        }`}>
                          {s.statusPagamento}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {s.statusPagamento === 'Pendente' && (
                            <>
                              <button
                                onClick={() => {
                                  if (confirm(`Confirmar recebimento do pagamento do pedido ${s.numero}?`)) {
                                    updateVendaMutation.mutate({ ...s, statusPagamento: 'Pago' });
                                    showToast(`Pagamento da venda ${s.numero} confirmado!`, 'success');
                                  }
                                }}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded cursor-pointer"
                                id={`pay-sale-btn-${s.id}`}
                              >
                                Confirmar Pgto
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Tem certeza de que deseja cancelar a venda ${s.numero}?`)) {
                                    updateVendaMutation.mutate({ ...s, statusPagamento: 'Cancelado' });
                                    showToast(`Venda ${s.numero} cancelada.`, 'error');
                                  }
                                }}
                                className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 hover:text-red-500 text-neutral-500 text-[10px] rounded cursor-pointer"
                                id={`cancel-sale-btn-${s.id}`}
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteSale(s)}
                            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                            title="Excluir Venda (Retorna orçamento a Pendente)"
                            id={`delete-sale-btn-${s.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 font-mono text-xs">
                    Nenhuma venda registrada ou faturada ainda. Converta propostas aceitas na aba "Orçamentos".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
