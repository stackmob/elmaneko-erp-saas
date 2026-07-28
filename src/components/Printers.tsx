import React, { useState } from 'react';
import { Printer } from '../types';
import { Plus, Edit, Trash2, Zap, Cpu } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';

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

  // Form Fields
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [potenciaWatts, setPotenciaWatts] = useState(350);
  const [status, setStatus] = useState<'Ativa' | 'Manutenção' | 'Inativa'>('Ativa');

  // Get current energy tariff
  const getCurrentTariffValue = (): number => {
    if (tariffs.length === 0) return 0.85; // default fallback
    const sorted = [...tariffs].sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
    return sorted[0].valorKwh;
  };

  const currentTariffKwh = getCurrentTariffValue();

  const handleOpenAddModal = () => {
    setEditingPrinter(null);
    setNome('');
    setMarca('');
    setModelo('');
    setPotenciaWatts(350);
    setStatus('Ativa');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Printer) => {
    setEditingPrinter(p);
    setNome(p.nome);
    setMarca(p.marca);
    setModelo(p.modelo);
    setPotenciaWatts(p.potenciaWatts);
    setStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !marca || !modelo || potenciaWatts <= 0) {
      alert('Por favor, informe todos os campos obrigatórios.');
      return;
    }

    const printerData: Printer = {
      id: editingPrinter ? editingPrinter.id : crypto.randomUUID(),
      nome,
      marca,
      modelo,
      potenciaWatts: Number(potenciaWatts),
      status
    };

    const onSuccess = () => {
      setIsModalOpen(false);
      showToast(editingPrinter ? 'Impressora atualizada com sucesso!' : 'Impressora cadastrada com sucesso!', 'success');
    };
    const onError = () => showToast('Erro ao salvar impressora.', 'error');

    if (editingPrinter) {
      editMutation.mutate(printerData, { onSuccess, onError });
    } else {
      addMutation.mutate(printerData, { onSuccess, onError });
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDialog({ open: true, id, name });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(confirmDialog.id, {
      onSuccess: () => showToast('Impressora excluída.', 'warning'),
      onError: () => showToast('Erro ao excluir impressora.', 'error')
    });
    setConfirmDialog({ open: false, id: '', name: '' });
  };

  return (
    <div className="space-y-6" id="printers-module-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
      <ConfirmDialog
        open={confirmDialog.open}
        title="Excluir Impressora"
        description={`Tem certeza que deseja excluir "${confirmDialog.name}"? Ordens de produção associadas precisarão de atualização.`}
        confirmLabel="Excluir Impressora"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: '', name: '' })}
      />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="printers-header">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Cadastro de Impressoras 3D</h2>
          <p className="text-sm text-neutral-400 mt-1">Gerencie seu maquinário 3D. Estime o consumo de energia em tempo real com base no valor de kWh vigente.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          id="add-new-printer-btn"
          className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-md shadow-orange-600/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <Plus size={18} />
          Cadastrar Impressora
        </button>
      </div>

      {/* DETAILED INFO CARD ABOUT ENERGY CALC */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono" id="energy-info-banner">
        <div className="flex items-center gap-2.5 text-neutral-300">
          <Zap size={16} className="text-orange-500 animate-pulse" />
          <span>Tarifa de energia atual em vigência: <strong className="text-white">R$ {currentTariffKwh.toFixed(4)} / kWh</strong>.</span>
        </div>
        <div className="text-neutral-500 text-[11px] uppercase tracking-wider">
          Fórmula: Consumo kWh = (Watts × Horas) / 1000
        </div>
      </div>

      {/* GRID LISTING OF PRINTER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="printers-grid">
        {printers.length > 0 ? (
          printers.map(p => {
            // calculated metrics
            const consumptionPerHourKwh = p.potenciaWatts / 1000;
            const costPerHour = consumptionPerHourKwh * currentTariffKwh;

            return (
              <div 
                key={p.id} 
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-orange-500/20 transition-all duration-300 relative overflow-hidden group"
                id={`card-printer-${p.id}`}
              >
                {/* STATUS BAR (GLOWS IN BG) */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  p.status === 'Ativa' ? 'bg-emerald-500' :
                  p.status === 'Manutenção' ? 'bg-amber-500' :
                  'bg-neutral-700'
                }`} />

                <div>
                  {/* Card Title & Badges */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">{p.nome}</h3>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">{p.marca} • {p.modelo}</p>
                    </div>
                    
                    <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      p.status === 'Ativa' ? 'bg-emerald-950/60 border border-emerald-500/20 text-emerald-400' :
                      p.status === 'Manutenção' ? 'bg-amber-950/60 border border-amber-500/20 text-amber-400' :
                      'bg-neutral-950 border border-neutral-800 text-neutral-500'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  {/* Technical Specifications */}
                  <div className="mt-5 space-y-2 font-mono text-xs text-neutral-400 border-t border-neutral-800/60 pt-4" id="printer-specifications">
                    <div className="flex justify-between">
                      <span>Potência Nominal:</span>
                      <strong className="text-white">{p.potenciaWatts} W</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Consumo / Hora:</span>
                      <strong className="text-white">{consumptionPerHourKwh.toFixed(3)} kWh</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Custo Energético / Hora:</span>
                      <strong className="text-orange-500">R$ {costPerHour.toFixed(4)}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between border-t border-neutral-800/60 mt-5 pt-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
                    <Cpu size={12} />
                    ID: {p.id.slice(0, 8)}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Editar Máquina"
                      id={`edit-printer-btn-${p.id}`}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.nome)}
                      className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Máquina"
                      id={`delete-printer-btn-${p.id}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-neutral-500 font-mono text-xs bg-neutral-900 border border-neutral-800 rounded-2xl">
            Nenhuma impressora 3D cadastrada. Clique em "Cadastrar Impressora" para começar.
          </div>
        )}
      </div>

      {/* FORM DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="printer-form-modal">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingPrinter ? 'Editar Impressora' : 'Adicionar Impressora 3D'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              
              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Nome de Identificação *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Marca *</label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Potência Nominal (Watts) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={potenciaWatts}
                    onChange={(e) => setPotenciaWatts(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Status Operacional *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Ativa' | 'Manutenção' | 'Inativa')}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="Ativa">Ativa</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Inativa">Inativa</option>
                  </select>
                </div>
              </div>

              {/* ESTIMATE CARD */}
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1 text-[11px] font-mono text-neutral-400">
                <span className="text-orange-500 font-bold block mb-1">📈 PREVISÃO DE ENERGIA OPERACIONAL:</span>
                <p>• Consumo de energia: <span className="text-white">{(potenciaWatts / 1000).toFixed(3)} kWh por hora</span></p>
                <p>• Custo estimado: <span className="text-white">R$ {((potenciaWatts / 1000) * currentTariffKwh).toFixed(4)} por hora de impressão</span></p>
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
