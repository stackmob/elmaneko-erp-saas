import React from 'react';
import { ArrowUpRight, ArrowDownLeft, DollarSign, Wallet } from 'lucide-react';

interface FinancialKpiCardsProps {
  totalReceitasMes: number;
  totalDespesasMes: number;
  lucroLiquido: number;
  saldoTotalContas: number;
}

export const FinancialKpiCards: React.FC<FinancialKpiCardsProps> = ({
  totalReceitasMes,
  totalDespesasMes,
  lucroLiquido,
  saldoTotalContas
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="financial-kpi-cards">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[11px] font-mono text-neutral-400 uppercase block">Receitas Acumuladas</span>
          <strong className="text-xl font-black font-mono text-emerald-400 mt-1 block">
            R$ {totalReceitasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">Liquidado / Recebido</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <ArrowUpRight size={22} />
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[11px] font-mono text-neutral-400 uppercase block">Despesas Acumuladas</span>
          <strong className="text-xl font-black font-mono text-red-400 mt-1 block">
            R$ {totalDespesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">Pago / Insumos & Infra</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400">
          <ArrowDownLeft size={22} />
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[11px] font-mono text-neutral-400 uppercase block">Lucro Líquido Realizado</span>
          <strong className={`text-xl font-black font-mono mt-1 block ${lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">Receitas - Despesas</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-orange-950/50 border border-orange-500/30 flex items-center justify-center text-orange-400">
          <DollarSign size={22} />
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[11px] font-mono text-neutral-400 uppercase block">Saldo Total em Bancos</span>
          <strong className="text-xl font-black font-mono text-cyan-400 mt-1 block">
            R$ {saldoTotalContas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">Contas Bancárias & Carteiras</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Wallet size={22} />
        </div>
      </div>
    </div>
  );
};
