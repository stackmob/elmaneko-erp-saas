import React from 'react';
import { FinancialAccount } from '../../types';
import { Wallet, CreditCard, Plus, Edit, Trash2, Building } from 'lucide-react';

interface FinancialAccountsTabProps {
  accounts: FinancialAccount[];
  onOpenAddModal: () => void;
  onEditAccount: (acc: FinancialAccount) => void;
  onDeleteAccount: (id: string) => void;
}

export const FinancialAccountsTab: React.FC<FinancialAccountsTabProps> = ({
  accounts,
  onOpenAddModal,
  onEditAccount,
  onDeleteAccount
}) => {
  return (
    <div className="space-y-6 animate-fade-in" id="financial-tab-accounts">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Wallet size={18} className="text-orange-500" />
            Contas Bancárias, Carteiras & Cartões
          </h3>
          <p className="text-xs text-neutral-400">
            Gerencie onde o saldo da sua empresa fica custodiado (Itaú, Bradesco, NuBank, Caixa Físico, Cartões).
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="py-2 px-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus size={15} />
          + Nova Conta ou Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-sm relative group">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  {acc.tipo === 'Cartao Credito' ? <CreditCard size={20} /> : <Building size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{acc.nome}</h4>
                  <span className="text-[11px] text-neutral-400 font-mono block">
                    {acc.banco ? `${acc.banco} • ` : ''}{acc.tipo}
                  </span>
                </div>
              </div>
              
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                acc.situacao === 'Ativa' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-red-950/60 text-red-400 border border-red-500/30'
              }`}>
                {acc.situacao}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase block">Saldo Atual</span>
                <span className="text-lg font-black font-mono text-white mt-0.5 block">
                  R$ {Number(acc.saldoAtual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditAccount(acc)}
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Editar Conta"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => onDeleteAccount(acc.id)}
                  className="p-1.5 hover:bg-red-950/50 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  title="Excluir Conta"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
