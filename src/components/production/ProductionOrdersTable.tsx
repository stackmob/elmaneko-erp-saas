import React from 'react';
import { ProductionOrder, Product, Printer, ProductionStatus } from '../../types';
import { Printer as PrinterIcon, Clock, CheckCircle2, XCircle, Edit, Trash2, Filter } from 'lucide-react';

interface ProductionOrdersTableProps {
  orders: ProductionOrder[];
  products: Product[];
  printers: Printer[];
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  onOpenAddModal: () => void;
  onEditOrder: (ord: ProductionOrder) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateStatus: (id: string, status: ProductionStatus) => void;
}

export const ProductionOrdersTable: React.FC<ProductionOrdersTableProps> = ({
  orders,
  products,
  printers,
  filterStatus,
  setFilterStatus,
  onOpenAddModal,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus
}) => {
  const getProductName = (id: string) => {
    const p = products.find(prod => prod.id === id);
    return p ? p.nome : 'Produto Não Identificado';
  };

  const getPrinterName = (id: string) => {
    const pr = printers.find(p => p.id === id);
    return pr ? pr.nome : 'Impressora Padrão';
  };

  return (
    <div className="space-y-4" id="production-orders-table-container">
      {/* FILTER BAR */}
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <Filter size={14} className="text-orange-500" />
            Status da Produção:
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl p-2 font-mono focus:border-orange-500 outline-none"
          >
            <option value="todos">Todas as Ordens</option>
            <option value="Em Produção">Em Produção</option>
            <option value="Finalizada">Finalizada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* ORDERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map(ord => (
          <div key={ord.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-sm flex flex-col justify-between relative group">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-mono text-orange-400 font-bold uppercase block">{ord.numero}</span>
                  <h4 className="font-bold text-sm text-white mt-0.5">{getProductName(ord.produtoId)}</h4>
                </div>

                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  ord.status === 'Finalizada'
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                    : ord.status === 'Em Produção'
                    ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-red-950/60 text-red-400 border border-red-500/30'
                }`}>
                  {ord.status}
                </span>
              </div>

              <div className="text-xs text-neutral-400 space-y-1.5 mb-4 font-mono">
                <div className="flex justify-between">
                  <span>Quantidade:</span>
                  <span className="text-white font-bold">{ord.quantidade} un</span>
                </div>
                <div className="flex justify-between">
                  <span>Impressora:</span>
                  <span className="text-neutral-300">{getPrinterName(ord.impressoraId)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operador:</span>
                  <span className="text-neutral-300">{ord.operador || 'Operador Padrão'}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-neutral-800 text-white font-bold text-xs">
                  <span>Custo Total:</span>
                  <span className="text-orange-400">R$ {Number(ord.custoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditOrder(ord)}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Editar Ordem"
                >
                  <Edit size={15} />
                </button>
                <button
                  onClick={() => onDeleteOrder(ord.id)}
                  className="p-1.5 hover:bg-red-950/50 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  title="Excluir Ordem"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {ord.status === 'Em Produção' && (
                <button
                  onClick={() => onUpdateStatus(ord.id, 'Finalizada')}
                  className="py-1 px-2.5 bg-emerald-950 border border-emerald-500/30 hover:bg-emerald-900 text-emerald-300 font-mono text-[11px] font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <CheckCircle2 size={13} />
                  Concluir Ordem
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
