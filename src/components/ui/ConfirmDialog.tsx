import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Excluir',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in"
      id="confirm-dialog-overlay"
      onClick={onCancel}
    >
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
            id="confirm-dialog-cancel-btn"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors shadow-lg shadow-red-900/30"
            id="confirm-dialog-confirm-btn"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
