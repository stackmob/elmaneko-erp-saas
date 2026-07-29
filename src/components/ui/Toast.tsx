import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastType } from '../../hooks/useToast';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onClose: () => void;
}

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const containerStyles: Record<ToastType, string> = {
  success: 'bg-emerald-950/95 border-emerald-500/30 text-emerald-200',
  error: 'bg-red-950/95 border-red-500/30 text-red-200',
  warning: 'bg-amber-950/95 border-amber-500/30 text-amber-200',
  info: 'bg-blue-950/95 border-blue-500/30 text-blue-200',
};

const iconStyles: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
};

export default function Toast({ message, type, visible, onClose }: ToastProps) {
  if (!visible || !message) return null;
  const Icon = icons[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm max-w-sm animate-fade-in ${containerStyles[type]}`}
      id="toast-notification"
    >
      <Icon size={18} className={`shrink-0 ${iconStyles[type]}`} />
      <span className="text-sm font-mono flex-1 leading-snug">{message}</span>
      <button
        onClick={onClose}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
    </div>
  );
}
