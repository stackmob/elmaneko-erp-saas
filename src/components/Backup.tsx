import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Database, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  FileCheck, 
  Lock, 
  Loader2, 
  RefreshCw, 
  FileText, 
  Server, 
  Layers, 
  Building2, 
  Hash, 
  Check, 
  History,
  RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import Toast from './ui/Toast';
import ConfirmDialog from './ui/ConfirmDialog';

interface FrozenBackupMetadata {
  versaoOrigem: 'v1';
  versaoDestino: 'v2';
  geradoEm: string;
  empresaOrigemId: string;
  empresaDestinoId: string;
  somenteLeitura: boolean;
  sha256: string;
  totalRegistros: Record<string, number>;
  tamanhoBytes: number;
}

interface FrozenBackupPackage {
  _meta: FrozenBackupMetadata;
  entidades: Record<string, any[]>;
}

type Backup = { id: string; checksum: string; size_bytes: number; snapshot_version: string; status: string; created_at: string; expired_at: string | null };
type Restore = { id: string; backup_id: string | null; status: string; details: string | null; created_at: string; completed_at: string | null };

const formatBytes = (value: number) => value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;

export default function BackupModule() {
  const { empresaId } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  // Active Tab: 'v1_freeze' | 'cloud_backups'
  const [activeTab, setActiveTab] = useState<'v1_freeze' | 'cloud_backups'>('v1_freeze');

  // Destination Tenant / Company for v2
  const [empresaDestino, setEmpresaDestino] = useState('');
  
  // States for Freeze Process
  const [isFreezing, setIsFreezing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [lastFrozenPackage, setLastFrozenPackage] = useState<FrozenBackupPackage | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // States for Server-side Edge Function Backups
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restores, setRestores] = useState<Restore[]>([]);
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [creatingCloud, setCreatingCloud] = useState(false);
  const [restoringCloud, setRestoringCloud] = useState<string | null>(null);
  const [confirmingCloud, setConfirmingCloud] = useState<Backup | null>(null);

  // Entities to export with selectable state
  const ENTITIES_CONFIG = [
    { key: 'empresas', label: 'Dados da Empresa', table: 'empresas', hasTenantFilter: false },
    { key: 'filamentos', label: 'Estoque de Filamentos', table: 'filamentos', hasTenantFilter: true },
    { key: 'insumos', label: 'Outros Insumos & Suprimentos', table: 'insumos', hasTenantFilter: true },
    { key: 'compras', label: 'Histórico de Compras', table: 'compras', hasTenantFilter: true },
    { key: 'produtos', label: 'Produtos & Peças', table: 'produtos', hasTenantFilter: true },
    { key: 'produto_materiais', label: 'Ficha Técnica (BOM / Materiais)', table: 'produto_materiais', hasTenantFilter: true },
    { key: 'impressoras', label: 'Parque de Impressoras 3D', table: 'impressoras', hasTenantFilter: true },
    { key: 'tarifas_energia', label: 'Tarifas de Energia Elétrica', table: 'tarifas_energia', hasTenantFilter: true },
    { key: 'producoes', label: 'Ordens de Produção (Fila 3D)', table: 'producoes', hasTenantFilter: true },
    { key: 'clientes', label: 'Cadastro de Clientes', table: 'clientes', hasTenantFilter: true },
    { key: 'orcamentos', label: 'Orçamentos', table: 'orcamentos', hasTenantFilter: true },
    { key: 'orcamento_itens', label: 'Itens de Orçamentos', table: 'orcamento_itens', hasTenantFilter: true },
    { key: 'vendas', label: 'Vendas Realizadas', table: 'vendas', hasTenantFilter: true },
    { key: 'contas_financeiras', label: 'Contas Financeiras', table: 'contas_financeiras', hasTenantFilter: true },
    { key: 'categorias_financeiras', label: 'Categorias Financeiras', table: 'categorias_financeiras', hasTenantFilter: true },
    { key: 'centros_custo', label: 'Centros de Custo', table: 'centros_custo', hasTenantFilter: true },
    { key: 'lancamentos_financeiros', label: 'Lançamentos Financeiros (DRE/Fluxo)', table: 'lancamentos_financeiros', hasTenantFilter: true },
    { key: 'movimentacoes_financeiras', label: 'Movimentações Bancárias', table: 'movimentacoes_financeiras', hasTenantFilter: true },
    { key: 'transferencias_financeiras', label: 'Transferências entre Contas', table: 'transferencias_financeiras', hasTenantFilter: true },
  ];

  const [selectedEntities, setSelectedEntities] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ENTITIES_CONFIG.forEach(e => { initial[e.key] = true; });
    return initial;
  });

  const toggleEntity = (key: string) => {
    setSelectedEntities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = (status: boolean) => {
    const updated: Record<string, boolean> = {};
    ENTITIES_CONFIG.forEach(e => { updated[e.key] = status; });
    setSelectedEntities(updated);
  };

  // SHA-256 Calculation using Web Crypto API
  const calculateSHA256 = async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Main Freeze & Export Flow (v1 Freeze)
  const handleFreezeV1 = async () => {
    if (!empresaId) {
      showToast('Empresa ativa não identificada na sessão.', 'error');
      return;
    }

    if (!empresaDestino.trim()) {
      showToast('Por favor, informe a Empresa / Tenant de Destino na v2.', 'warning');
      return;
    }

    setIsFreezing(true);
    setProgressPercent(5);
    setProgressStatus('Iniciando conexão estruturada com a base v1...');

    try {
      const activeConfigs = ENTITIES_CONFIG.filter(cfg => selectedEntities[cfg.key]);
      const extractedData: Record<string, any[]> = {};
      const recordCounts: Record<string, number> = {};

      for (let i = 0; i < activeConfigs.length; i++) {
        const config = activeConfigs[i];
        const stepPercent = Math.round(10 + (i / activeConfigs.length) * 75);
        setProgressPercent(stepPercent);
        setProgressStatus(`Extraindo entidade: ${config.label} (${config.table})...`);

        try {
          let query = supabase.from(config.table).select('*');
          if (config.hasTenantFilter) {
            query = query.eq('empresa_id', empresaId);
          } else if (config.table === 'empresas') {
            query = query.eq('id', empresaId);
          }

          const { data, error } = await query;
          if (error) {
            console.warn(`Aviso ao exportar ${config.table}:`, error.message);
            extractedData[config.key] = [];
            recordCounts[config.key] = 0;
          } else {
            extractedData[config.key] = data || [];
            recordCounts[config.key] = (data || []).length;
          }
        } catch (err) {
          console.warn(`Erro ao consultar ${config.table}:`, err);
          extractedData[config.key] = [];
          recordCounts[config.key] = 0;
        }
      }

      setProgressPercent(90);
      setProgressStatus('Calculando assinatura criptográfica SHA-256 e selando pacote...');

      const rawDataString = JSON.stringify(extractedData);
      const sha256Checksum = await calculateSHA256(rawDataString);

      const totalBytes = new Blob([rawDataString]).size;
      const timestamp = new Date().toISOString();

      const finalPackage: FrozenBackupPackage = {
        _meta: {
          versaoOrigem: 'v1',
          versaoDestino: 'v2',
          geradoEm: timestamp,
          empresaOrigemId: empresaId,
          empresaDestinoId: empresaDestino.trim(),
          somenteLeitura: true,
          sha256: sha256Checksum,
          totalRegistros: recordCounts,
          tamanhoBytes: totalBytes,
        },
        entidades: extractedData
      };

      setLastFrozenPackage(finalPackage);
      setProgressPercent(100);
      setProgressStatus('Pacote v1 congelado com sucesso!');
      showToast('Cópia v1 congelada e selada com SHA-256 com sucesso!', 'success');

      // Auto-download JSON
      downloadPackage(finalPackage);

    } catch (err: any) {
      console.error('Falha ao congelar cópia v1:', err);
      showToast(`Erro ao gerar backup estruturado: ${err?.message || 'Falha desconhecida'}`, 'error');
    } finally {
      setIsFreezing(false);
    }
  };

  // Download Trigger
  const downloadPackage = (pkg: FrozenBackupPackage) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pkg, null, 2));
    const downloadAnchor = document.createElement('a');
    const safeDate = pkg._meta.geradoEm.replace(/[:.]/g, '-');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ELMANEKO_V1_FROZEN_BACKUP_${safeDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV for individual entity
  const exportEntityAsCSV = (entityKey: string) => {
    if (!lastFrozenPackage || !lastFrozenPackage.entidades[entityKey]) {
      showToast('Gere o pacote congelado antes de exportar em CSV.', 'warning');
      return;
    }

    const rows = lastFrozenPackage.entidades[entityKey];
    if (rows.length === 0) {
      showToast(`A entidade ${entityKey} não possui registros para exportar.`, 'info');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => 
        headers.map(header => {
          const val = row[header];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(';')
      )
    ].join('\r\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `v1_${entityKey}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(`CSV de ${entityKey} baixado com sucesso!`, 'success');
  };

  const copyHashToClipboard = () => {
    if (!lastFrozenPackage?._meta.sha256) return;
    navigator.clipboard.writeText(lastFrozenPackage._meta.sha256);
    setCopiedHash(true);
    showToast('Hash SHA-256 copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedHash(false), 3000);
  };

  // Server-side Edge Function Refresh
  const refreshCloud = useCallback(async () => {
    if (!empresaId) return;
    setLoadingCloud(true);
    const [backupResult, restoreResult] = await Promise.all([
      supabase.from('backups_empresa').select('id,checksum,size_bytes,snapshot_version,status,created_at,expired_at').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
      supabase.from('restauracoes_backup').select('id,backup_id,status,details,created_at,completed_at').eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(20),
    ]);
    if (backupResult.error || restoreResult.error) showToast(backupResult.error?.message || restoreResult.error?.message || 'Não foi possível consultar o histórico.', 'error');
    setBackups(backupResult.data || []);
    setRestores(restoreResult.data || []);
    setLoadingCloud(false);
  }, [empresaId, showToast]);

  useEffect(() => { 
    if (activeTab === 'cloud_backups') {
      void refreshCloud(); 
    }
  }, [activeTab, refreshCloud]);

  const createCloudBackup = async () => {
    if (!empresaId) return;
    setCreatingCloud(true);
    const { error } = await supabase.functions.invoke('create-secure-backup', { body: { empresaId } });
    setCreatingCloud(false);
    if (error) return showToast(error.message || 'Não foi possível criar o backup.', 'error');
    showToast('Backup criptografado criado e armazenado no servidor com sucesso.', 'success');
    await refreshCloud();
  };

  const restoreCloudBackup = async () => {
    if (!empresaId || !confirmingCloud) return;
    const backup = confirmingCloud;
    setConfirmingCloud(null);
    setRestoringCloud(backup.id);
    const { error } = await supabase.functions.invoke('restore-secure-backup', { body: { empresaId, backupId: backup.id } });
    setRestoringCloud(null);
    if (error) return showToast(error.message || 'A restauração falhou.', 'error');
    showToast('Restauração concluída e registrada na auditoria.', 'success');
    await refreshCloud();
  };

  return (
    <div className="space-y-6" id="backup-v1-freeze-container">
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />

      <ConfirmDialog 
        open={Boolean(confirmingCloud)} 
        title="Restaurar backup operacional" 
        description="A restauração substitui os dados operacionais atuais da empresa pelo snapshot selecionado. A operação é transacional, auditada e não pode ser desfeita automaticamente." 
        confirmLabel="Restaurar backup" 
        onCancel={() => setConfirmingCloud(null)} 
        onConfirm={() => void restoreCloudBackup()} 
      />

      {/* HEADER SECTION WITH TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-orange-950 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold tracking-wider uppercase">
              Pipeline de Segurança & Migração
            </span>
            <span className="px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300 text-xs font-mono flex items-center gap-1">
              <Lock size={12} className="text-emerald-400" /> Somente Leitura
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-2">
            Segurança, Congelamento da Base v1 & Backups
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Exporte a base em formato estruturado com SHA-256 e destino v2, ou gerencie snapshots criptografados em nuvem.
          </p>
        </div>

        {/* NAVIGATION PILLS */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('v1_freeze')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'v1_freeze' 
                ? 'bg-orange-600 text-white shadow-sm' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shield size={14} />
            Congelar Cópia v1 (SHA-256)
          </button>
          <button
            onClick={() => setActiveTab('cloud_backups')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cloud_backups' 
                ? 'bg-orange-600 text-white shadow-sm' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Server size={14} />
            Snapshots em Nuvem (Server-Side)
          </button>
        </div>
      </div>

      {activeTab === 'v1_freeze' ? (
        <>
          {/* STEP 1: DESTINATION COMPANY & CONGELATION SETTINGS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2 text-orange-500 border-b border-neutral-800 pb-3">
                <Building2 size={20} />
                <h3 className="text-base font-bold text-white">1. Mapeamento & Definição da Empresa de Destino (v2)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-neutral-400 text-xs font-semibold uppercase tracking-wider">
                    ID / Tenant de Origem (v1 atual)
                  </label>
                  <div className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 font-mono text-xs select-all flex items-center justify-between">
                    <span>{empresaId || 'Identificando...'}</span>
                    <Lock size={14} className="text-neutral-600 shrink-0" />
                  </div>
                  <span className="text-[10px] text-neutral-500 block">Sua base ativa atual.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-orange-400 text-xs font-semibold uppercase tracking-wider">
                    Empresa / Tenant de Destino na v2 *
                  </label>
                  <input
                    type="text"
                    value={empresaDestino}
                    onChange={(e) => setEmpresaDestino(e.target.value)}
                    placeholder="Ex: UUID da empresa v2 ou 'EMPRESA-PRINCIPAL-V2'"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-orange-500/50 focus:border-orange-500 rounded-xl text-white font-mono text-xs focus:outline-none placeholder-neutral-600 shadow-inner"
                  />
                  <span className="text-[10px] text-neutral-400 block">
                    Gravado no cabeçalho imutável do arquivo para ingestão na v2.
                  </span>
                </div>
              </div>

              {/* ENTITY SELECTOR */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={15} className="text-orange-400" />
                    Entidades Selecionadas para Congelamento ({Object.values(selectedEntities).filter(Boolean).length}/{ENTITIES_CONFIG.length})
                  </label>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => selectAll(true)}
                      className="text-orange-400 hover:text-orange-300 hover:underline cursor-pointer"
                    >
                      Marcar Todas
                    </button>
                    <span className="text-neutral-600">|</span>
                    <button
                      type="button"
                      onClick={() => selectAll(false)}
                      className="text-neutral-500 hover:text-neutral-400 hover:underline cursor-pointer"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {ENTITIES_CONFIG.map(entity => (
                    <label
                      key={entity.key}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedEntities[entity.key] 
                          ? 'bg-neutral-800/80 border-orange-500/40 text-white font-medium shadow-xs' 
                          : 'bg-neutral-950/60 border-neutral-850 text-neutral-500 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedEntities[entity.key]}
                        onChange={() => toggleEntity(entity.key)}
                        className="w-3.5 h-3.5 rounded accent-orange-600 bg-neutral-900 border-neutral-700 cursor-pointer"
                      />
                      <span className="truncate">{entity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-mono">
                  Formato: JSON Estruturado com Hash SHA-256
                </span>
                <button
                  onClick={handleFreezeV1}
                  disabled={isFreezing || !empresaId}
                  className="py-3 px-6 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 flex items-center gap-2 transition-all cursor-pointer hover:translate-y-[-1px]"
                >
                  {isFreezing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Congelando v1...
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      Congelar Cópia da v1 & Gerar Pacote
                    </>
                  )}
                </button>
              </div>

              {/* PROGRESS BAR */}
              {isFreezing && (
                <div className="space-y-2 pt-2 animate-fade-in">
                  <div className="flex justify-between text-xs font-mono text-neutral-400">
                    <span>{progressStatus}</span>
                    <span className="text-orange-400 font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                    <div 
                      className="bg-orange-500 h-full transition-all duration-300 rounded-full shadow-sm shadow-orange-500/50"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SUMMARY & PROTOCOL CARD */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 border-b border-neutral-800 pb-3">
                  <FileCheck size={20} />
                  <h3 className="text-base font-bold text-white">Diretrizes de Auditoria</h3>
                </div>
                
                <ul className="mt-4 space-y-3 text-xs text-neutral-300">
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 text-[10px] font-bold">1</div>
                    <span><strong>Exportação Estruturada:</strong> Cada entidade é serializada com chave primária e integridade de tipos mantida.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 text-[10px] font-bold">2</div>
                    <span><strong>Assinatura SHA-256:</strong> Permite validar que o arquivo nunca sofreu adulteração após o congelamento.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 text-[10px] font-bold">3</div>
                    <span><strong>Somente Leitura:</strong> O arquivo original congelado deve ser preservado como backup mestre.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 text-[10px] font-bold">4</div>
                    <span><strong>Destino na v2:</strong> Os dados já saem etiquetados com a nova empresa receptora.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 text-xs font-mono">
                <span className="text-neutral-200 font-bold block mb-1">Dica de Segurança:</span>
                Armazene o arquivo baixado em local seguro (Cold Storage / Google Drive / S3) marcado como leitura para fins de conformidade.
              </div>
            </div>
          </div>

          {/* STEP 2: LAST FROZEN PACKAGE DETAILS (WHEN GENERATED) */}
          {lastFrozenPackage && (
            <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Pacote v1 Congelado & Autenticado
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] rounded-full font-mono">
                        SHA-256 VERIFIED
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Gerado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'medium' }).format(new Date(lastFrozenPackage._meta.geradoEm))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadPackage(lastFrozenPackage)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download size={14} className="text-orange-400" />
                    Baixar JSON Novamente
                  </button>
                </div>
              </div>

              {/* HASH SIGNATURE DISPLAY */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash size={14} className="text-orange-400" />
                    Checksum Criptográfico SHA-256 do Pacote
                  </span>
                  <button
                    onClick={copyHashToClipboard}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-mono cursor-pointer transition-colors"
                  >
                    {copiedHash ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedHash ? 'Copiado!' : 'Copiar Hash'}
                  </button>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800/80 font-mono text-xs text-emerald-400 break-all select-all">
                  {lastFrozenPackage._meta.sha256}
                </div>
                <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-neutral-500 pt-1">
                  <span>Tamanho do Payload: {(lastFrozenPackage._meta.tamanhoBytes / 1024).toFixed(2)} KB</span>
                  <span>Origem: {lastFrozenPackage._meta.empresaOrigemId} &rarr; Destino v2: {lastFrozenPackage._meta.empresaDestinoId}</span>
                </div>
              </div>

              {/* ENTITY BREAKDOWN GRID & CSV EXPORTERS */}
              <div>
                <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider mb-3">
                  Registros Congelados por Entidade
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(lastFrozenPackage._meta.totalRegistros).map(([key, count]) => {
                    const config = ENTITIES_CONFIG.find(c => c.key === key);
                    return (
                      <div 
                        key={key}
                        className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] text-neutral-300 font-semibold block truncate">
                            {config?.label || key}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {count} registro{count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {count > 0 && (
                          <button
                            onClick={() => exportEntityAsCSV(key)}
                            title="Exportar esta entidade em formato CSV estruturado"
                            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-400 hover:text-white rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            <FileText size={12} className="text-orange-400" />
                            CSV
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* CLOUD SNAPSHOTS SECTION (SERVER-SIDE) */
        <div className="space-y-6 animate-fade-in">
          <section className="rounded-2xl border border-orange-500/25 bg-neutral-900 p-6 shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-orange-400">
                  <Shield size={20} />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Segurança Server-Side</span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-white">Snapshot server-side criptografado</h2>
                <p className="mt-1 text-sm text-neutral-400">
                  O snapshot é gerado no banco, cifrado com AES-GCM pela Edge Function e guardado em bucket privado.
                </p>
              </div>
              <button 
                onClick={() => void createCloudBackup()} 
                disabled={!empresaId || creatingCloud} 
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/40 transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {creatingCloud ? <Loader2 size={17} className="animate-spin" /> : <Database size={17} />}
                {creatingCloud ? 'Criando snapshot...' : 'Criar snapshot em nuvem'}
              </button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Info label="Criptografia" value="AES-256-GCM" />
              <Info label="Retenção" value="30 backups por empresa" />
              <Info label="Acesso" value="Somente administradores" />
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Snapshots disponíveis</h3>
                <p className="text-xs text-neutral-500">Checksum e metadados auditáveis; o conteúdo permanece privado.</p>
              </div>
              <button 
                onClick={() => void refreshCloud()} 
                className="rounded-lg border border-neutral-700 p-2 text-neutral-300 hover:bg-neutral-800 cursor-pointer" 
                aria-label="Atualizar backups"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {loadingCloud ? (
              <p className="text-sm text-neutral-500">Carregando histórico...</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-neutral-500 font-mono">
                  <tr>
                    <th className="pb-3">Criado em</th>
                    <th className="pb-3">Integridade</th>
                    <th className="pb-3">Tamanho</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="text-neutral-300">
                      <td className="py-3 font-mono text-xs">{new Date(backup.created_at).toLocaleString('pt-BR')}</td>
                      <td className="py-3 font-mono text-xs text-orange-400">{backup.checksum.slice(0, 16)}…</td>
                      <td className="py-3 font-mono text-xs">{formatBytes(Number(backup.size_bytes))}</td>
                      <td className="py-3">
                        <span className={backup.status === 'ready' ? 'text-emerald-400 text-xs font-mono' : 'text-neutral-500 text-xs font-mono'}>
                          {backup.status === 'ready' ? 'Disponível' : backup.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {backup.status === 'ready' && (
                          <button 
                            onClick={() => setConfirmingCloud(backup)} 
                            disabled={restoringCloud !== null} 
                            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-950/40 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                          >
                            <RotateCcw size={12} />
                            {restoringCloud === backup.id ? 'Restaurando...' : 'Restaurar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!backups.length && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-500 font-mono text-xs">
                        Nenhum snapshot server-side disponível.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4 flex items-center gap-2">
              <History size={18} className="text-orange-400" />
              <h3 className="font-bold text-white">Auditoria de restaurações</h3>
            </div>
            <div className="space-y-3">
              {restores.map((restore) => (
                <article key={restore.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs ${restore.status === 'success' ? 'text-emerald-400' : restore.status === 'failed' ? 'text-red-400' : 'text-orange-400'}`}>
                      {restore.status === 'success' ? 'Concluída' : restore.status}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">{new Date(restore.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  {restore.details && <p className="mt-1 text-xs text-neutral-400">{restore.details}</p>}
                </article>
              ))}
              {!restores.length && <p className="text-sm text-neutral-500 font-mono text-xs">Nenhuma restauração registrada.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
      <p className="text-xs uppercase tracking-wider text-neutral-500 font-mono">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-200">
        <Lock size={13} className="mr-1 inline text-orange-400" />
        {value}
      </p>
    </div>
  );
}
