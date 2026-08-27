import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, History, Loader2, Lock, RefreshCw, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';

type Backup = { id: string; checksum: string; size_bytes: number; snapshot_version: string; status: string; created_at: string; expired_at: string | null };
type Restore = { id: string; backup_id: string | null; status: string; details: string | null; created_at: string; completed_at: string | null };

const formatBytes = (value: number) => value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;

export default function BackupModule() {
  const { empresaId } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restores, setRestores] = useState<Restore[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Backup | null>(null);

  const refresh = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    const [backupResult, restoreResult] = await Promise.all([
      supabase.from('backups_empresa').select('id,checksum,size_bytes,snapshot_version,status,created_at,expired_at').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
      supabase.from('restauracoes_backup').select('id,backup_id,status,details,created_at,completed_at').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(20),
    ]);
    if (backupResult.error || restoreResult.error) showToast(backupResult.error?.message || restoreResult.error?.message || 'Não foi possível consultar o histórico.', 'error');
    setBackups(backupResult.data || []);
    setRestores(restoreResult.data || []);
    setLoading(false);
  }, [empresaId, showToast]);

  useEffect(() => { void refresh(); }, [refresh]);

  const createBackup = async () => {
    if (!empresaId) return;
    setCreating(true);
    const { error } = await supabase.functions.invoke('create-secure-backup', { body: { empresaId } });
    setCreating(false);
    if (error) return showToast(error.message || 'Não foi possível criar o backup.', 'error');
    showToast('Backup criptografado criado e armazenado com sucesso.', 'success');
    await refresh();
  };

  const restoreBackup = async () => {
    if (!empresaId || !confirming) return;
    const backup = confirming;
    setConfirming(null);
    setRestoring(backup.id);
    const { error } = await supabase.functions.invoke('restore-secure-backup', { body: { empresaId, backupId: backup.id } });
    setRestoring(null);
    if (error) return showToast(error.message || 'A restauração falhou.', 'error');
    showToast('Restauração concluída e registrada na auditoria.', 'success');
    await refresh();
  };

  return <div className="space-y-6">
    <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
    <ConfirmDialog open={Boolean(confirming)} title="Restaurar backup operacional" description="A restauração substitui os dados operacionais atuais da empresa pelo snapshot selecionado. A operação é transacional, auditada e não pode ser desfeita automaticamente." confirmLabel="Restaurar backup" onCancel={() => setConfirming(null)} onConfirm={() => void restoreBackup()} />
    <section className="rounded-2xl border border-orange-500/25 bg-neutral-900 p-6 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><div className="flex items-center gap-2 text-orange-400"><Shield size={20} /><span className="text-xs font-mono font-bold uppercase tracking-wider">Segurança v2</span></div><h2 className="mt-2 text-xl font-bold text-white">Backup server-side criptografado</h2><p className="mt-1 text-sm text-neutral-400">O snapshot é criado no banco, cifrado com AES-GCM pela Edge Function e guardado em bucket privado. Nenhum JSON operacional é baixado para o navegador.</p></div>
        <button onClick={() => void createBackup()} disabled={!empresaId || creating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/40 transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50">{creating ? <Loader2 size={17} className="animate-spin" /> : <Database size={17} />}{creating ? 'Criando backup...' : 'Criar backup agora'}</button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3"><Info label="Criptografia" value="AES-256-GCM" /><Info label="Retenção" value="30 backups por empresa" /><Info label="Acesso" value="Somente administradores" /></div>
    </section>
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold text-white">Backups disponíveis</h3><p className="text-xs text-neutral-500">Checksum e metadados auditáveis; o conteúdo permanece privado.</p></div><button onClick={() => void refresh()} className="rounded-lg border border-neutral-700 p-2 text-neutral-300 hover:bg-neutral-800" aria-label="Atualizar backups"><RefreshCw size={16} /></button></div>{loading ? <p className="text-sm text-neutral-500">Carregando histórico...</p> : <table className="w-full text-left text-sm"><thead className="text-xs uppercase text-neutral-500"><tr><th className="pb-3">Criado em</th><th className="pb-3">Integridade</th><th className="pb-3">Tamanho</th><th className="pb-3">Status</th><th className="pb-3" /></tr></thead><tbody>{backups.map((backup) => <tr key={backup.id} className="border-t border-neutral-800 text-neutral-300"><td className="py-3">{new Date(backup.created_at).toLocaleString('pt-BR')}</td><td className="py-3 font-mono text-xs">{backup.checksum.slice(0, 16)}…</td><td className="py-3">{formatBytes(Number(backup.size_bytes))}</td><td className="py-3"><span className={backup.status === 'ready' ? 'text-emerald-400' : 'text-neutral-500'}>{backup.status}</span></td><td className="py-3 text-right">{backup.status === 'ready' && <button onClick={() => setConfirming(backup)} disabled={restoring !== null} className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-950/40 disabled:opacity-50">{restoring === backup.id ? 'Restaurando...' : 'Restaurar'}</button>}</td></tr>)}{!backups.length && <tr><td colSpan={5} className="py-8 text-center text-neutral-500">Nenhum backup disponível.</td></tr>}</tbody></table>}</section>
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"><div className="mb-4 flex items-center gap-2"><History size={18} className="text-orange-400" /><h3 className="font-bold text-white">Auditoria de restaurações</h3></div><div className="space-y-3">{restores.map((restore) => <article key={restore.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm"><div className="flex items-center justify-between"><span className={restore.status === 'success' ? 'text-emerald-400' : restore.status === 'failed' ? 'text-red-400' : 'text-orange-400'}>{restore.status}</span><span className="text-xs text-neutral-500">{new Date(restore.created_at).toLocaleString('pt-BR')}</span></div>{restore.details && <p className="mt-1 text-xs text-neutral-400">{restore.details}</p>}</article>)}{!restores.length && <p className="text-sm text-neutral-500">Nenhuma restauração registrada.</p>}</div></section>
    <div className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-xs text-amber-200"><AlertTriangle size={16} className="shrink-0" />A restauração substitui dados operacionais da empresa. O histórico de auditoria financeiro permanece preservado conforme a política de imutabilidade.</div>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3"><p className="text-xs uppercase tracking-wider text-neutral-500">{label}</p><p className="mt-1 text-sm font-semibold text-neutral-200"><Lock size={13} className="mr-1 inline text-orange-400" />{value}</p></div>; }
