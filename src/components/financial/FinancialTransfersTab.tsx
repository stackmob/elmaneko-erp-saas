import React from 'react';
import { FinancialTransfer, FinancialAccount } from '../../types';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { formatDateBR } from '../../utils/formatters';

interface FinancialTransfersTabProps {
  transfers: FinancialTransfer[];
  accounts: FinancialAccount[];
  onOpenTransferModal: () => void;
}

export const FinancialTransfersTab: React.FC<FinancialTransfersTabProps> = ({
  transfers,
  accounts,
  onOpenTransferModal
}) => {
  const getAccountName = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.nome : id;
  };

  return (
    <div className="space-y-4 font-mono text-xs" id="financial-tab-transfers">
      <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-orange-500" />
            Transferências entre Contas
          </h3>
          <p className="text-neutral-400 text-[11px] mt-0.5">
            Histórico de movimentações de saldo interno entre suas contas bancárias e caixas.
          </p>
        </div>
        <button
          onClick={onOpenTransferModal}
          className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/20"
        >
          <Plus size={14} />
          Nova Transferência
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950/40 text-[11px] uppercase tracking-wider text-neutral-400">
              <th className="p-3">Data</th>
              <th className="p-3">Conta Origem</th>
              <th className="p-3">Conta Destino</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-mono">
            {transfers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-500 italic">
                  Nenhuma transferência realizada até o momento.
                </td>
              </tr>
            ) : (
              transfers.map(tr => (
                <tr key={tr.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="p-3">{formatDateBR(tr.data)}</td>
                  <td className="p-3 text-red-400">{getAccountName(tr.contaOrigemId)}</td>
                  <td className="p-3 text-emerald-400">{getAccountName(tr.contaDestinoId)}</td>
                  <td className="p-3 font-bold text-white">
                    R$ {Number(tr.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-neutral-400">{tr.observacoes || '-'}</td>
                </tr>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
