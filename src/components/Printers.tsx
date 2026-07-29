import React, { useState } from 'react';
import { Printer } from '../types';
import { Plus, Search, Zap, Cpu, X } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';
import { DataList, ColumnDef } from './ui/DataList';

export default function Printers() {
  const { useImpressoras, useTarifas, useAddImpressora, useUpdateImpressora, useDeleteImpressora } = useData();
  const { data: printers = [] } = useImpressoras();
  const { data: tariffs = [] } = useTarifas();
  const addMutation = useAddImpressora();
  const editMutation = useUpdateImpressora();
  const deleteMutation = useDeleteImpressora();
  const { toast, showToast, hideToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [potenciaWatts, setPotenciaWatts] = useState(350);
  const [status, setStatus] = useState<'Ativa' | 'Manutenção' | 'Inativa'>('Ativa');

  const getCurrentTariffValue = (): number => {
    if (tariffs.length === 0) return 0.85;
    const sorted = [...tariffs].sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
    return sorted[0].valorKwh;
  };
  const currentTariffKwh = getCurrentTariffValue();

  const handleOpenAddModal = () => {
    setEditingPrinter(null);
    setNome(''); setMarca(''); setModelo('');
    setPotenciaWatts(350); setStatus('Ativa');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Printer) => {
    setEditingPrinter(p);
    setNome(p.nome); setMarca(p.marca); setModelo(p.modelo);
    setPotenciaWatts(p.potenciaWatts); setStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !marca || !modelo || potenciaWatts <= 0) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }
    const printerData: Printer = {
      id: editingPrinter ? editingPrinter.id : crypto.randomUUID(),
      nome, marca, modelo,
      potenciaWatts: Number(potenciaWatts),
      status
    };
    const onSuccess = () => { setIsModalOpen(false); showToast(editingPrinter ? 'Impressora atualizada!' : 'Impressora cadastrada!', 'success'); };
    const onError = () => showToast('Erro ao salvar impressora.', 'error');
    editingPrinter ? editMutation.mutate(printerData, { onSuccess, onError }) : addMutation.mutate(printerData, { onSuccess, onError });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(confirmDialog.id, {
      onSuccess: () => showToast('Impressora excluída.', 'warning'),
      onError: () => showToast('Erro ao excluir.', 'error')
    });
    setConfirmDialog({ open: false, id: '', name: '' });
  };

  const filtered = printers.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.nome.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q) || p.modelo.toLowerCase().includes(q);
  });

  // ── Status badge helper ──
  const statusBadge = (p: Printer) => (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-bold rounded-full ${
      p.status === 'Ativa' ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400' :
      p.status === 'Manutenção' ? 'bg-amber-950/60 border border-amber-500/30 text-amber-400' :
      'bg-neutral-950 border border-neutral-700 text-neutral-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        p.status === 'Ativa' ? 'bg-emerald-400' :
        p.status === 'Manutenção' ? 'bg-amber-400' : 'bg-neutral-600'
      }`} />
      {p.status}
    </span>
  );

  // ── Column definitions ──
  const mainColumns: ColumnDef<Printer>[] = [
    {
      key: 'nome',
      header: 'Impressora',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center text-orange-400 shrink-0">
            <Cpu size={15} />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{p.nome}</p>
            <p className="text-[11px] text-neutral-500 font-mono">{p.marca} · {p.modelo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: statusBadge,
    },
    {
      key: 'potencia',
      header: 'Potência',
      align: 'right',
      render: (p) => (
        <span className="font-mono text-white font-semibold text-sm">{p.potenciaWatts} <span className="text-neutral-500 text-xs font-normal">W</span></span>
      ),
    },
    {
      key: 'custo_hora',
      header: 'Custo / Hora',
      align: 'right',
      render: (p) => {
        const cost = (p.potenciaWatts / 1000) * currentTariffKwh;
        return <span className="font-mono text-orange-400 font-semibold text-sm">R$ {cost.toFixed(4)}</span>;
      },
    },
  ];

  const extraColumns: ColumnDef<Printer>[] = [
    {
      key: 'consumo_kwh',
      header: 'Consumo / Hora (kWh)',
      render: (p) => <span className="text-neutral-300">{(p.potenciaWatts / 1000).toFixed(3)} kWh</span>,
    },
    {
      key: 'custo_8h',
      header: 'Custo Estimado 8h',
      render: (p) => {
        const cost = (p.potenciaWatts / 1000) * currentTariffKwh * 8;
        return <span className="text-neutral-300 font-mono">R$ {cost.toFixed(2)}</span>;
      },
    },
    {
      key: 'custo_24h',
      header: 'Custo Estimado 24h',
      render: (p) => {
        const cost = (p.potenciaWatts / 1000) * currentTariffKwh * 24;
        return <span className="text-neutral-300 font-mono">R$ {cost.toFixed(2)}</span>;
      },
    },
    {
      key: 'id_ref',
      header: 'ID Referência',
      render: (p) => <span className="text-neutral-500 font-mono">{p.id.slice(0, 12)}…</span>,
    },
  ];

  return (
    <div className="space-y-5" id="printers-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
      <ConfirmDialog
        open={confirmDialog.open}
        title="Excluir Impressora"
        description={`Tem certeza que deseja excluir "${confirmDialog.name}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: '', name: '' })}
      />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Impressoras 3D</h2>
          <p className="text-sm text-neutral-400 mt-1">Gerencie maquinário e estime custo de energia em tempo real.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          id="add-new-printer-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl flex items-center gap-2 hover:-translate-y-px transition-all cursor-pointer shrink-0"
        >
          <Plus size={18} />
          Nova Impressora
        </button>
      </div>

      {/* ── ENERGY INFO BANNER ── */}
      <div className="px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-2.5 text-xs font-mono text-neutral-300" id="energy-info-banner">
        <Zap size={15} className="text-orange-500 shrink-0" />
        Tarifa vigente: <strong className="text-white">R$ {currentTariffKwh.toFixed(4)} / kWh</strong>
        <span className="ml-auto text-neutral-600 text-[10px] uppercase tracking-wider">Custo = (W × h) / 1000 × kWh</span>
      </div>

      {/* ── SEARCH ── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        <input
          id="printers-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar por nome, marca ou modelo..."
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
          aria-label="Pesquisar impressoras"
        />
      </div>

      {/* ── LIST ── */}
      <DataList<Printer>
        data={filtered}
        columns={mainColumns}
        extraColumns={extraColumns}
        rowKey={(p) => p.id}
        onEdit={handleOpenEditModal}
        onDelete={(p) => setConfirmDialog({ open: true, id: p.id, name: p.nome })}
        emptyMessage={searchQuery ? 'Nenhuma impressora encontrada.' : 'Nenhuma impressora cadastrada.'}
      />

      {/* ── FORM MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="printer-form-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100 font-sans">
            
            {/* STICKY HEADER */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Cpu size={20} className="text-orange-500" />
                {editingPrinter ? 'Editar Impressora' : 'Nova Impressora 3D'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Fechar Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 font-mono text-xs flex-1">
                
                <div>
                  <label htmlFor="printer-nome" className="block text-neutral-300 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                    Nome de Identificação <span className="text-orange-500">*</span>
                  </label>
                  <input id="printer-nome" type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 transition-colors" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="printer-marca" className="block text-neutral-300 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Marca <span className="text-orange-500">*</span>
                    </label>
                    <input id="printer-marca" type="text" required value={marca} onChange={(e) => setMarca(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="printer-modelo" className="block text-neutral-300 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Modelo <span className="text-orange-500">*</span>
                    </label>
                    <input id="printer-modelo" type="text" required value={modelo} onChange={(e) => setModelo(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="printer-potencia" className="block text-neutral-300 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Potência (W) <span className="text-orange-500">*</span>
                    </label>
                    <input id="printer-potencia" type="number" required min={1} value={potenciaWatts} onChange={(e) => setPotenciaWatts(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="printer-status" className="block text-neutral-300 mb-1.5 font-semibold uppercase tracking-wider text-[11px]">
                      Status <span className="text-orange-500">*</span>
                    </label>
                    <select id="printer-status" value={status} onChange={(e) => setStatus(e.target.value as 'Ativa' | 'Manutenção' | 'Inativa')}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer transition-colors">
                      <option value="Ativa">Ativa</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Inativa">Inativa</option>
                    </select>
                  </div>
                </div>

                {/* Live energy estimate */}
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1 text-[11px] font-mono text-neutral-400">
                  <span className="text-orange-400 font-bold block mb-1">Previsão de Energia</span>
                  <p>Consumo: <span className="text-white">{(potenciaWatts / 1000).toFixed(3)} kWh / hora</span></p>
                  <p>Custo: <span className="text-white">R$ {((potenciaWatts / 1000) * currentTariffKwh).toFixed(4)} / hora</span></p>
                </div>

              </div>

              {/* STICKY ACTIONS FOOTER */}
              <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl cursor-pointer transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl cursor-pointer shadow-md shadow-orange-600/20 transition-colors">
                  Salvar Impressora
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
