import React, { useState, useEffect } from 'react';
import { ProductionOrder, Filament, Product } from '../../types';
import { Modal } from '../ui/Modal';
import { Package, CheckCircle2, ArrowRight } from 'lucide-react';

interface CompleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder | null;
  filaments: Filament[];
  products?: Product[];
  onConfirmComplete: (orderId: string, filamentId: string, pesoGramas: number) => void;
}

export const CompleteOrderModal: React.FC<CompleteOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  filaments,
  products = [],
  onConfirmComplete,
}) => {
  if (!order) return null;

  // Localiza o produto para calcular o peso unitário com base na engenharia BOM
  const product = products.find(p => p.id === order.produtoId);
  const totalBOMUnitGrams = product?.materials?.reduce((acc, m) => acc + (Number(m.quantidadeGrams) || 0), 0) || 50;
  const initialTotalGrams = (order.quantidade || 1) * totalBOMUnitGrams;

  // Localiza o filamento padrão preferencial pelo tipo do material no BOM
  const primaryMaterial = product?.materials?.[0];
  const preferredFilament = primaryMaterial
    ? filaments.find(f => primaryMaterial.filamentoId && primaryMaterial.filamentoId !== 'any' ? f.id === primaryMaterial.filamentoId : f.tipo === primaryMaterial.tipoFilamento)
    : undefined;

  const defaultFilamentId = preferredFilament?.id || (filaments.length > 0 ? filaments[0].id : '');

  const [selectedFilamentId, setSelectedFilamentId] = useState<string>(defaultFilamentId);
  const [pesoEfetivoGramas, setPesoEfetivoGramas] = useState<number>(initialTotalGrams);

  useEffect(() => {
    setSelectedFilamentId(defaultFilamentId);
    setPesoEfetivoGramas(initialTotalGrams);
  }, [order?.id, defaultFilamentId, initialTotalGrams]);

  const selectedFilament = filaments.find(f => f.id === selectedFilamentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFilamentId) return;
    onConfirmComplete(order.id, selectedFilamentId, Number(pesoEfetivoGramas));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Concluir Ordem de Produção & Baixar Estoque"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs text-neutral-200">
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-orange-400 font-bold uppercase">{order.numero}</span>
            <span className="bg-amber-950/60 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
              {order.status}
            </span>
          </div>
          <p className="text-sm font-bold text-white">Qtd: {order.quantidade} unidades</p>
        </div>

        <div>
          <label className="block text-neutral-400 mb-1 font-bold uppercase">
            Bobina de Filamento Utilizada *
          </label>
          <select
            value={selectedFilamentId}
            onChange={(e) => setSelectedFilamentId(e.target.value)}
            required
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-bold focus:border-orange-500 outline-none"
          >
            <option value="">Selecione o Filamento...</option>
            {filaments.map((fil) => (
              <option key={fil.id} value={fil.id}>
                {fil.nome} - {fil.cor} ({fil.quantidadeDisponivel}g disp.)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-neutral-400 mb-1 font-bold uppercase">
            Peso Total Consumido a Deducar (Gramas) *
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              required
              value={pesoEfetivoGramas}
              onChange={(e) => setPesoEfetivoGramas(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-bold focus:border-orange-500 outline-none"
            />
            <span className="text-neutral-400 font-bold shrink-0">gramas</span>
          </div>
        </div>

        {selectedFilament && (
          <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between text-emerald-300">
            <div className="flex items-center gap-2">
              <Package size={16} />
              <span>Estoque Atual vs Final:</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              <span>{selectedFilament.quantidadeDisponivel}g</span>
              <ArrowRight size={12} />
              <span className="text-emerald-400">{Math.max(0, selectedFilament.quantidadeDisponivel - pesoEfetivoGramas)}g</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <CheckCircle2 size={15} />
            Confirmar Conclusão & Abater
          </button>
        </div>
      </form>
    </Modal>
  );
};
