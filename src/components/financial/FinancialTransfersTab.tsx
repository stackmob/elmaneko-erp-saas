import React from 'react';
import { FinancialTransfer, FinancialAccount } from '../../types';
import { ArrowRightLeft, Plus } from 'lucide-react';

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
    <div className="space-y-6 animate-fade-in" id="financial-tab-transfers">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-orange-500" />
            Histórico de Transferências entre Contas & Carteiras
          </h3>
          <p className="text-xs text-neutral-400">
            Movimentações internas de saldo entre suas próprias contas sem afetar a receita/despesa operacional.
          </p>
        </div>

        <button
          onClick={onOpenTransferModal}
          className="py-2 px-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus size={15} />
          + Nova Transferência
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
              <tr>
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
                    <td className="p-3">{tr.data}</td>
                    <td className="p-3 text-red-400">{getAccountName(tr.contaOrigemId)}</td>
                    <td className="p-3 text-emerald-400">{getAccountName(tr.contaDestinoId)}</td>
                    <td className="p-3 font-bold text-white">
                      R$ {Number(tr.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-neutral-400">{tr.observacoes || '-'}</td>
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
