import React, { useState } from 'react';
import { Sale, Client, Product, Filament } from '../types';
import { 
  DollarSign, Calendar, User, TrendingUp, AlertCircle, CheckCircle, 
  XCircle, Filter, ShoppingBag, Eye, CreditCard, ChevronRight, Trash2 
} from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';

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

  // FILTERS
  const [filterClient, setFilterClient] = useState('todos');
  const [filterPayment, setFilterPayment] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');

  // KPIS
  const paidSales = sales.filter(s => s.statusPagamento === 'Pago');
  const pendingSales = sales.filter(s => s.statusPagamento === 'Pendente');
  const cancelledSales = sales.filter(s => s.statusPagamento === 'Cancelado');

  const totalFaturadoVal = paidSales.reduce((acc, s) => acc + s.valorTotal, 0);
  const totalPendenteVal = pendingSales.reduce((acc, s) => acc + s.valorTotal, 0);
  const averageTicket = paidSales.length > 0 ? totalFaturadoVal / paidSales.length : 0;

  // Filter Sales list
  const filteredSales = sales.filter(s => {
    const matchesClient = filterClient === 'todos' || s.clienteId === filterClient;
    const matchesPayment = filterPayment === 'todos' || s.formaPagamento === filterPayment;
    const matchesStatus = filterStatus === 'todos' || s.statusPagamento === filterStatus;
    return matchesClient && matchesPayment && matchesStatus;
  });
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

      {/* SALES KPIS BOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-in" id="sales-kpis">
        {/* Total Faturado */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-400">
            <span>Faturamento Líquido (Pago)</span>
            <TrendingUp size={14} className="text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">
            R$ {totalFaturadoVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 font-mono">de {paidSales.length} transações liquidadas</p>
        </div>

        {/* Pendentes */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-400">
            <span>Valores Pendentes</span>
            <AlertCircle size={14} className="text-orange-500" />
          </div>
          <div className="text-xl font-black text-orange-400 mt-1">
            R$ {totalPendenteVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 font-mono">em {pendingSales.length} ordens abertas</p>
        </div>

        {/* Ticket Medio */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-400">
            <span>Ticket Médio por Venda</span>
            <DollarSign size={14} className="text-neutral-500" />
          </div>
          <div className="text-xl font-black text-white mt-1">
            R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1 font-mono">Média ponderada faturada</p>
        </div>

        {/* Cancelados */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-neutral-400">
            <span>Cancelamentos</span>
            <XCircle size={14} className="text-neutral-600" />
          </div>
          <div className="text-xl font-black text-neutral-500 mt-1">
            {cancelledSales.length} <span className="text-xs font-normal">pedidos</span>
          </div>
          <p className="text-[10px] text-neutral-600 mt-1 font-mono">Taxa de rejeição pós-orçamento</p>
        </div>
      </div>

      {/* FILTER BAR ROW */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center" id="sales-filters">
        <span className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5 shrink-0">
          <Filter size={14} /> Filtros de Auditoria:
        </span>

        {/* Cliente Filter */}
        <div className="flex-1 w-full">
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none cursor-pointer"
          >
            <option value="todos">Filtrar por Todos os Clientes</option>
            {clients.map(cl => (
              <option key={cl.id} value={cl.id}>{cl.nome}</option>
            ))}
          </select>
        </div>

        {/* Forma de Pagamento */}
        <div className="w-full md:w-56">
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none cursor-pointer"
          >
            <option value="todos">Formas de Pagamento (Todas)</option>
            <option value="Pix">Pix</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="Boleto">Boleto Bancário</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
        </div>

        {/* Status de Pagamento */}
        <div className="w-full md:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none cursor-pointer"
          >
            <option value="todos">Qualquer Status</option>
            <option value="Pago">Pago (Liquidado)</option>
            <option value="Pendente">Pendente (Aberto)</option>
            <option value="Cancelado">Cancelado</option>
          </select>
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
              {filteredSales.length > 0 ? (
                [...filteredSales].sort((a,b)=>b.numero.localeCompare(a.numero)).map(s => {
                  const client = clients.find(cl => cl.id === s.clienteId);

                  return (
                    <tr key={s.id} className="hover:bg-neutral-800/10 transition-colors" id={`row-sale-${s.id}`}>
                      <td className="py-3.5 px-4 font-mono font-black text-white">
                        {s.numero}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-400 whitespace-nowrap">
                        {s.dataVenda}
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
