import React, { useState } from 'react';
import { EnergyTariff } from '../types';
import { Plus, Zap, Calendar, History, DollarSign } from 'lucide-react';
import { useData } from '../hooks/useData';

export default function EnergyTariffModule() {
  const { useTarifas, useAddTarifa } = useData();
  const { data: tariffs = [] } = useTarifas();
  const addMutation = useAddTarifa();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [valorKwh, setValorKwh] = useState(0.85);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valorKwh <= 0 || !dataInicio) {
      alert('Por favor, informe valores válidos.');
      return;
    }

    const newTariff: EnergyTariff = {
      id: crypto.randomUUID(),
      dataInicio,
      valorKwh: Number(valorKwh)
    };

    addMutation.mutate(newTariff);
    setIsModalOpen(false);
  };

  // Sort tariffs descending by start date
  const sortedTariffs = [...tariffs].sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
  const activeTariff = sortedTariffs[0];

  return (
    <div className="space-y-6" id="energy-tariff-container">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="energy-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Custo de Energia (Tarifa kWh)</h2>
          <p className="text-sm text-neutral-400 mt-1">Configure o valor cobrado pela distribuidora por kWh para cálculos exatos de custos operacionais.</p>
        </div>
        <button
          onClick={() => {
            setDataInicio(new Date().toISOString().split('T')[0]);
            setValorKwh(activeTariff ? activeTariff.valorKwh : 0.85);
            setIsModalOpen(true);
          }}
          id="add-new-tariff-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <Plus size={18} />
          Cadastrar Nova Alíquota
        </button>
      </div>

      {/* KPI STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="energy-kpis">
        {/* Active Tariff Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden" id="active-tariff-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xs font-mono uppercase text-orange-500 tracking-widest font-bold mb-4 flex items-center gap-1.5">
            <Zap size={14} className="animate-pulse" /> Tarifa Ativa no Sistema
          </h3>
          {activeTariff ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm text-neutral-400 font-mono">R$</span>
                <span className="text-4xl font-black text-white">{activeTariff.valorKwh.toFixed(4)}</span>
                <span className="text-xs text-neutral-500 font-mono">/ kWh</span>
              </div>
              <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 pt-2 border-t border-neutral-800/60 mt-4">
                <Calendar size={12} className="text-neutral-500" />
                Vigência iniciada em: <strong>{activeTariff.dataInicio}</strong>
              </p>
            </div>
          ) : (
            <span className="text-neutral-500 font-mono text-xs">Nenhuma tarifa cadastrada.</span>
          )}
        </div>

        {/* Informational Guidelines Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-xs text-neutral-400 leading-relaxed space-y-3" id="energy-guidelines-card">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <History size={16} className="text-neutral-500" /> Como funciona a vigência?
          </h4>
          <p>
            O sistema ELMANEKO calcula os custos de energia ponderados por tempo de impressão e consumo nominal em Watts das impressoras.
          </p>
          <p className="font-mono bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/60">
            • O sistema sempre localiza a tarifa correspondente à data da produção. Se não houver data correspondente, utilizará a tarifa ativa mais recente disponível.
          </p>
          <p>
            Manter o histórico atualizado garante auditorias de custos retroativas idôneas, sem flutuações artificiais de margem.
          </p>
        </div>
      </div>

      {/* TARIFF HISTORY LIST */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl" id="tariffs-history-table-wrapper">
        <div className="p-4 bg-neutral-950/40 border-b border-neutral-800 flex items-center gap-2">
          <History size={16} className="text-neutral-500" />
          <h3 className="text-xs font-mono uppercase text-neutral-400 tracking-wider font-semibold">Histórico de Alterações de Tarifas</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="tariffs-table">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/20 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                <th className="py-4 px-6 font-semibold">Data Início da Vigência</th>
                <th className="py-4 px-6 font-semibold">Valor por kWh</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Identificador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-300">
              {sortedTariffs.map((t, idx) => {
                const isActive = idx === 0;
                return (
                  <tr key={t.id} className="hover:bg-neutral-800/10 transition-colors" id={`row-tariff-${t.id}`}>
                    <td className="py-3.5 px-6 font-mono text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <Calendar size={14} className="text-neutral-500" />
                        {t.dataInicio}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-orange-400">
                      R$ {t.valorKwh.toFixed(4)} <span className="text-xs font-normal text-neutral-500">/ kWh</span>
                    </td>
                    <td className="py-3.5 px-6">
                      {isActive ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 rounded-md">
                          Ativa Atualmente
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[10px] font-mono bg-neutral-950 border border-neutral-800 text-neutral-500 rounded-md">
                          Histórico
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs text-neutral-500">
                      {t.id}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="energy-form-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={20} className="text-orange-500" />
              Cadastrar Nova Tarifa
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              
              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Início da Vigência *</label>
                <input
                  type="date"
                  required
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Valor do kWh (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-mono font-bold">R$</span>
                  <input
                    type="number"
                    required
                    step="0.0001"
                    min="0"
                    value={valorKwh}
                    onChange={(e) => setValorKwh(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">Consulte sua fatura de energia para extrair o custo do kWh com taxas inclusas.</span>
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
                  Salvar Vigência
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
