import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, History, Loader2, RotateCcw, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from './ui/ConfirmDialog';

type Backup = {
  id: string;
  size_bytes: number;
  status: 'ready' | 'expired' | 'corrupted';
  created_at: string;
};

type Restore = {
  id: string;
  backup_id: string | null;
  status: 'running' | 'success' | 'failed';
  details: string | null;
  created_at: string;
};

const formatDateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
const formatSize = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

export default function BackupModule() {
  const { empresaId } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restores, setRestores] = useState<Restore[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; backup: Backup | null }>({ open: false, backup: null });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const [backupResult, restoreResult] = await Promise.all([
        supabase.from('backups_empresa').select('id, size_bytes, status, created_at').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
        supabase.from('restauracoes_backup').select('id, backup_id, status, details, created_at').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(20),
      ]);
      if (backupResult.error) throw backupResult.error;
      if (restoreResult.error) throw restoreResult.error;
      setBackups((backupResult.data || []) as Backup[]);
      setRestores((restoreResult.data || []) as Restore[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o histórico de backup.');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => { void load(); }, [load]);

  const createBackup = async () => {
    if (!empresaId) return;
    setWorking(true); setError(''); setSuccess('');
    try {
      const { error: functionError } = await supabase.functions.invoke('create-secure-backup', { body: { empresaId } });
      if (functionError) throw functionError;
      setSuccess('Backup criptografado criado no servidor com sucesso.');
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Não foi possível criar o backup.');
    } finally {
      setWorking(false);
    }
  };

  const restoreBackup = async (backup: Backup) => {
    if (!empresaId || backup.status !== 'ready') return;
    setConfirmDialog({ open: true, backup });
  };

  const executeRestore = async (backup: Backup) => {
    setWorking(true); setError(''); setSuccess('');
    try {
      const { error: functionError } = await supabase.functions.invoke('restore-secure-backup', { body: { empresaId, backupId: backup.id } });
      if (functionError) throw functionError;
      setSuccess('Restauração concluída em transação única e registrada na auditoria.');
      await load();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Não foi possível restaurar o backup.');
      await load();
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6" id="backup-module-container">
      <ConfirmDialog
        open={confirmDialog.open}
        title="Restaurar Backup"
        description="A restauração substituirá todos os dados operacionais atuais por esta cópia. Deseja continuar?"
        confirmLabel="Restaurar Dados"
        onConfirm={() => {
          if (confirmDialog.backup) executeRestore(confirmDialog.backup);
          setConfirmDialog({ open: false, backup: null });
        }}
        onCancel={() => setConfirmDialog({ open: false, backup: null })}
      />
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Segurança, Backup e Restauração</h2>
        <p className="mt-1 text-sm text-neutral-400">Snapshots são gerados no servidor, criptografados com AES-GCM e armazenados em bucket privado. São mantidas até 30 cópias por empresa.</p>
      </div>

      {success && <div className="flex gap-2 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-xs text-emerald-200"><CheckCircle2 size={16} className="shrink-0 text-emerald-500" />{success}</div>}
      {error && <div className="flex gap-2 rounded-xl border border-red-800 bg-red-950/40 p-4 text-xs text-red-200"><AlertTriangle size={16} className="shrink-0 text-red-500" />{error}</div>}

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-white"><Database size={18} className="text-orange-500" />Backup protegido</h3>
            <p className="mt-1 text-xs text-neutral-400">A criação, retenção e integridade são processadas fora do navegador.</p>
          </div>
          <button onClick={() => void createBackup()} disabled={working || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {working ? <Loader2 size={15} className="animate-spin" /> : <Shield size={15} />} Criar backup criptografado
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl">
        <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-950/40 p-4"><History size={16} className="text-neutral-500" /><h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">Backups disponíveis</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-neutral-300"><thead><tr className="border-b border-neutral-800 text-neutral-400"><th className="p-4">Criado em</th><th className="p-4">Tamanho</th><th className="p-4">Status</th><th className="p-4 text-right">Ação</th></tr></thead>
            <tbody className="divide-y divide-neutral-800/60">{backups.length ? backups.map((backup) => <tr key={backup.id}><td className="p-4">{formatDateTime(backup.created_at)}</td><td className="p-4">{formatSize(backup.size_bytes)}</td><td className="p-4"><span className={backup.status === 'ready' ? 'text-emerald-400' : 'text-neutral-500'}>{backup.status === 'ready' ? 'Disponível' : 'Expirado'}</span></td><td className="p-4 text-right"><button onClick={() => void restoreBackup(backup)} disabled={working || backup.status !== 'ready'} className="inline-flex items-center gap-1 rounded-lg border border-blue-500/40 px-2.5 py-1.5 text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw size={13} />Restaurar</button></td></tr>) : <tr><td colSpan={4} className="p-10 text-center text-neutral-500">Nenhum backup seguro criado ainda.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl">
        <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-950/40 p-4"><History size={16} className="text-neutral-500" /><h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">Auditoria de restaurações</h3></div>
        <div className="divide-y divide-neutral-800/60">{restores.length ? restores.map((restore) => <div key={restore.id} className="flex items-center justify-between gap-4 p-4 text-xs"><div><p className="text-neutral-200">{formatDateTime(restore.created_at)}</p>{restore.details && <p className="mt-1 text-neutral-500">{restore.details}</p>}</div><span className={restore.status === 'success' ? 'text-emerald-400' : restore.status === 'failed' ? 'text-red-400' : 'text-amber-400'}>{restore.status === 'success' ? 'Concluída' : restore.status === 'failed' ? 'Falhou' : 'Em andamento'}</span></div>) : <p className="p-10 text-center text-xs text-neutral-500">Nenhuma restauração registrada.</p>}</div>
      </section>
    </div>
  );
}
