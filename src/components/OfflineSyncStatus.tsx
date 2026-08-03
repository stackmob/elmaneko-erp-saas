import { useCallback, useEffect, useState } from 'react';
import { CloudOff, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  discardOfflineOperation,
  listOfflineOperations,
  OfflineOperation,
  OFFLINE_QUEUE_CHANGED_EVENT,
  syncOfflineOperations,
} from '../utils/offlineQueue';

export default function OfflineSyncStatus() {
  const { empresaId } = useAuth();
  const [operations, setOperations] = useState<OfflineOperation[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    if (!empresaId) return;
    setOperations(await listOfflineOperations(empresaId));
  }, [empresaId]);

  useEffect(() => {
    void refresh();
    window.addEventListener('online', refresh);
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  const synchronize = async () => {
    if (!empresaId || !navigator.onLine) return;
    setSyncing(true);
    try {
      await syncOfflineOperations(empresaId);
    } finally {
      setSyncing(false);
      await refresh();
    }
  };

  const discard = async (id: string) => {
    await discardOfflineOperation(id);
    await refresh();
  };

  if (operations.length === 0) return null;

  const conflicts = operations.filter((operation) => operation.status === 'conflict').length;
  const pending = operations.length - conflicts;

  return (
    <aside className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-amber-500/40 bg-neutral-950/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex gap-3">
        <CloudOff className="mt-0.5 shrink-0 text-amber-400" size={20} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Sincronização pendente</p>
          <p className="mt-1 text-xs text-neutral-300">
            {pending > 0 && `${pending} operação(ões) aguardando conexão.`}
            {pending > 0 && conflicts > 0 && ' '}
            {conflicts > 0 && `${conflicts} conflito(s) exigem revisão.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void synchronize()}
              disabled={syncing || !navigator.onLine}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              Sincronizar
            </button>
            {operations.filter((operation) => operation.status === 'conflict').map((operation) => (
              <button
                key={operation.id}
                type="button"
                onClick={() => void discard(operation.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-500/50 px-2.5 py-1.5 text-xs text-red-300"
                title={operation.error || 'Descartar operação em conflito'}
              >
                <Trash2 size={13} /> Descartar conflito
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
