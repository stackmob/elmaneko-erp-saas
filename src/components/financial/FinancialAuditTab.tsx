import React from 'react';
import { FinancialAuditLog } from '../../types';
import { Shield } from 'lucide-react';

interface FinancialAuditTabProps {
  auditLogs: FinancialAuditLog[];
}

export const FinancialAuditTab: React.FC<FinancialAuditTabProps> = ({ auditLogs }) => {
  return (
    <div className="space-y-6 animate-fade-in" id="financial-tab-audit">
      <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Shield size={18} className="text-orange-500" />
          Trilha de Auditoria Imutável
        </h3>
        <p className="text-xs text-neutral-400">
          Histórico completo e seguro de todas as baixas, alterações de saldo, conciliações e exclusões financeiras.
        </p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 font-mono uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Usuário</th>
                <th className="p-3">IP</th>
                <th className="p-3">Operação</th>
                <th className="p-3">Entidade</th>
                <th className="p-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300 font-mono">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500 italic">
                    Nenhum registro de auditoria capturado até o momento.
                  </td>
                </tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="p-3 text-neutral-400">{log.dataHora}</td>
                    <td className="p-3 font-semibold text-white">{log.usuario}</td>
                    <td className="p-3 text-neutral-500">{log.ip || '127.0.0.1'}</td>
                    <td className="p-3 text-orange-400 font-bold">{log.operacao}</td>
                    <td className="p-3 text-neutral-300">{log.entidade}</td>
                    <td className="p-3 text-neutral-400">
                      {log.valorAnterior ? `De: ${log.valorAnterior} ` : ''}
                      {log.valorNovo ? `Para: ${log.valorNovo}` : '-'}
                    </td>
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
