import React from 'react';
import { Budget, Client, Product, Sale } from '../../types';
import { 
  FileText, Calendar, User, DollarSign, Eye, Edit, Trash2, 
  CheckCircle2, ArrowUpDown, Filter 
} from 'lucide-react';
import { formatDateBR } from '../../utils/formatters';

interface BudgetsTableProps {
  budgets: Budget[];
  clients: Client[];
  products: Product[];
  sales: Sale[];
  filterClient: string;
  setFilterClient: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  sortBy: string;
  setSortBy: (val: any) => void;
  onOpenAddModal: () => void;
  onEditBudget: (b: Budget) => void;
  onDeleteBudget: (id: string) => void;
  onPreviewPdf: (b: Budget) => void;
  onConvertBudget: (b: Budget) => void;
}

export const BudgetsTable: React.FC<BudgetsTableProps> = ({
  budgets,
  clients,
  products,
  sales,
  filterClient,
  setFilterClient,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  onOpenAddModal,
  onEditBudget,
  onDeleteBudget,
  onPreviewPdf,
  onConvertBudget
}) => {
  const getClientName = (id: string) => {
    const c = clients.find(client => client.id === id);
    return c ? c.nome : 'Cliente Desconhecido';
  };

  const calculateTotal = (b: Budget) => {
    const sumItens = (b.itens || []).reduce((acc, item) => {
      const itemPrice = (item.valorUnitario - item.desconto) * item.quantidade;
      return acc + Math.max(0, itemPrice);
    }, 0);
    return Math.max(0, sumItens - (b.descontoGeral || 0));
  };

  const isBudgetInvoiced = (b: Budget): boolean => {
    if (b.status === 'Faturado') return true;
    return sales.some(s => s.orcamentoOrigemId === b.id);
  };

  return (
    <div className="space-y-4" id="budgets-table-container">
      {/* FILTER & SORT BAR */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <Filter size={14} className="text-orange-500" />
            Filtrar:
          </div>

          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl p-2 font-mono focus:border-orange-500 outline-none"
          >
            <option value="todos">Todos os Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl p-2 font-mono focus:border-orange-500 outline-none"
          >
            <option value="todos">Todos os Status</option>
            <option value="Aberto">Aberto</option>
            <option value="Enviado">Enviado</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Faturado">Faturado</option>
            <option value="Rejeitado">Rejeitado</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-neutral-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl p-2 font-mono focus:border-orange-500 outline-none"
          >
            <option value="data_desc">Data (Mais recentes)</option>
            <option value="data_asc">Data (Mais antigos)</option>
            <option value="valor_desc">Valor (Maior valor)</option>
            <option value="valor_asc">Valor (Menor valor)</option>
          </select>
        </div>
      </div>

      {/* BUDGETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map(b => {
          const total = calculateTotal(b);
          const isInvoiced = isBudgetInvoiced(b);

          return (
            <div key={b.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-sm flex flex-col justify-between relative group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-orange-400 font-bold uppercase block">{b.numero}</span>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5 mt-0.5">
                      <User size={14} className="text-neutral-500" />
                      {getClientName(b.clienteId)}
                    </h4>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    b.status === 'Aprovado' || b.status === 'Faturado'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                      : b.status === 'Enviado'
                      ? 'bg-blue-950/60 text-blue-400 border border-blue-500/30'
                      : b.status === 'Rejeitado'
                      ? 'bg-red-950/60 text-red-400 border border-red-500/30'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div className="text-xs text-neutral-400 space-y-1 mb-4 font-mono">
                  <div className="flex justify-between">
                    <span>Emissão:</span>
                    <span>{formatDateBR(b.dataEmissao)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validade:</span>
                    <span>{formatDateBR(b.validade)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-neutral-800 text-white font-bold text-sm">
                    <span>Total:</span>
                    <span className="text-emerald-400">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onPreviewPdf(b)}
                    className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Visualizar Proposta / PDF"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => onEditBudget(b)}
                    className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Editar Orçamento"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => onDeleteBudget(b.id)}
                    className="p-1.5 hover:bg-red-950/50 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Orçamento"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {!isInvoiced && b.status !== 'Rejeitado' && (
                  <button
                    onClick={() => onConvertBudget(b)}
                    className="py-1 px-2.5 bg-emerald-950 border border-emerald-500/30 hover:bg-emerald-900 text-emerald-300 font-mono text-[11px] font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 size={13} />
                    Converter em Venda
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
