import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onCancel();
      }
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in"
      id="confirm-dialog-overlay"
      onClick={onCancel}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden my-auto text-neutral-100 font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER — mesmo padrão do Modal */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center gap-3 bg-neutral-900 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-red-950/70 border border-red-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h3>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 text-sm text-neutral-300 leading-relaxed">
          {description}
        </div>

        {/* FOOTER — mesmo padrão do Modal */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-semibold text-sm rounded-xl cursor-pointer transition-colors"
            id="confirm-dialog-cancel-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl cursor-pointer transition-colors shadow-lg shadow-red-950/40 flex items-center gap-1.5"
            id="confirm-dialog-confirm-btn"
          >
            <Trash2 size={15} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
